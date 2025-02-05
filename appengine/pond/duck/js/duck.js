/**
 * @license
 * Copyright 2014 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates a multi-user pond (duck page).
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Pond.Duck');

goog.require('Blockly.FlyoutButton');
goog.require('Blockly.utils.Coordinate');
goog.require('Blockly.utils.dom');
goog.require('Blockly.ZoomControls');
goog.require('BlocklyAce');
goog.require('BlocklyDialogs');
goog.require('BlocklyGames');
goog.require('BlocklyGames.Msg');
goog.require('BlocklyInterface');
goog.require('Pond');
goog.require('Pond.Battle');
goog.require('Pond.Blocks');
goog.require('Pond.Duck.html');
goog.require('Pond.Visualization');


BlocklyGames.NAME = 'pond-duck';

/**
 * Array of editor tabs (Blockly and ACE).
 * @type Array<!Element>
 */
Pond.Duck.editorTabs = null;

/**
 * ACE editor fires change events even on programmatically caused changes.
 * This property is used to signal times when a programmatic change is made.
 */
Pond.Duck.ignoreEditorChanges_ = true;

/**
 * Currently selected avatar.
 * @type Pond.Avatar
 */
Pond.currentAvatar = null;

/**
 * Array of duck data that was loaded separately.
 * @type Array<!Object>
 */
Pond.Duck.duckData = null;

/**
 * Indices of tabs.
 */
Pond.Duck.tabIndex = {
  BLOCKS: 0,
  JAVASCRIPT: 1,
};

/**
 * Initialize Ace and the pond.  Called on page load.
 */
Pond.Duck.init = function() {
  Pond.Duck.duckData = window['DUCKS'];
  // Render the HTML.
  document.body.innerHTML = Pond.Duck.html.start(
      {lang: BlocklyGames.LANG,
       html: BlocklyGames.IS_HTML});

  Pond.init(BlocklyGames.Msg['Games.pond']);

  // Setup the tabs.
  function tabHandler(selectedIndex) {
    return function() {
      if (Blockly.utils.dom.hasClass(tabs[selectedIndex], 'tab-disabled')) {
        return;
      }
      Pond.Duck.changeTab(selectedIndex);
    };
  }
  const tabs = Array.prototype.slice.call(
      document.querySelectorAll('#editorBar>.tab'));
  Pond.Duck.editorTabs = tabs;
  for (let i = 0; i < tabs.length; i++) {
    BlocklyGames.bindClick(tabs[i], tabHandler(i));
  }

  const rtl = BlocklyGames.IS_RTL;
  const visualization = document.getElementById('visualization');
  const tabDiv = document.getElementById('tabarea');
  const blocklyDiv = document.getElementById('blockly');
  const editorDiv = document.getElementById('editor');
  const divs = [blocklyDiv, editorDiv];
  const onresize = function(e) {
    const top = visualization.offsetTop;
    tabDiv.style.top = (top - window.pageYOffset) + 'px';
    tabDiv.style.left = rtl ? '10px' : '420px';
    tabDiv.style.width = (window.innerWidth - 440) + 'px';
    const divTop =
        Math.max(0, top + tabDiv.offsetHeight - window.pageYOffset) + 'px';
    const divLeft = rtl ? '10px' : '420px';
    const divWidth = (window.innerWidth - 440) + 'px';
    for (const div of divs) {
      div.style.top = divTop;
      div.style.left = divLeft;
      div.style.width = divWidth;
    }
  };
  window.addEventListener('scroll', function() {
    onresize(null);
    Blockly.svgResize(BlocklyInterface.workspace);
  });
  window.addEventListener('resize', onresize);
  onresize(null);

  // Inject JS editor.
  const session = BlocklyAce.makeAceSession();
  session['on']('change', Pond.Duck.editorChanged);

  // Lazy-load the ESx-ES5 transpiler.
  BlocklyAce.importBabel();

  Blockly.JavaScript.addReservedWords('scan,cannon,drive,swim,stop,speed,' +
      'damage,health,loc_x,getX,loc_y,getY,log');

  const coordinates = [
    new Blockly.utils.Coordinate(20, 80),
    new Blockly.utils.Coordinate(80, 80),
    new Blockly.utils.Coordinate(20, 20),
    new Blockly.utils.Coordinate(80, 20),
  ];
  const avatarSelect = document.getElementById('avatar-select');
  for (let i = 0; i < Pond.Duck.duckData.length; i++) {
    const duckData = Pond.Duck.duckData[i];
    if (duckData['name'] === null) {
      duckData['name'] = BlocklyGames.Msg['Pond.playerName'];
    }
    const option = new Option(duckData['name'], duckData['id']);
    avatarSelect.add(option);

    const avatar = new Pond.Avatar(duckData['name'], coordinates[i], 0,
        duckData['editable'], Pond.Battle);
    if (duckData['blockly'] === undefined && duckData['js'] === undefined) {
      duckData['js'] = duckData['compiled'];
    }
    if (duckData['js']) {
      // Strip off any leading blank lines, and any trailing whitespace.
      duckData['js'] = duckData['js'].replace(/^\s*\n/, '').trimRight();
    }
    avatar.setCode(duckData['blockly'], duckData['js'], duckData['compiled']);
  }
  avatarSelect.addEventListener('change', Pond.Duck.changeAvatar);
  Pond.reset();
  if (avatarSelect) {
    Pond.Duck.changeAvatar();
  }
};

/**
 * Called by the avatar selector when changed.
 */
Pond.Duck.changeAvatar = function() {
  Pond.Duck.ignoreEditorChanges_ = true;

  const avatarSelect = document.getElementById('avatar-select');
  const i = avatarSelect.selectedIndex;
  if (Pond.currentAvatar === Pond.Battle.AVATARS[i]) {
    return;
  }
  Pond.saveAvatar();
  Pond.currentAvatar = Pond.Battle.AVATARS[i];
  avatarSelect.style.backgroundColor =
      Pond.Visualization.getColour(Pond.currentAvatar);

  if (Pond.currentAvatar.blockly !== undefined) {
    if (BlocklyInterface.workspace) {
      BlocklyInterface.workspace.dispose();
    }
    BlocklyInterface.injectBlockly(
        {'rtl': false,
         'trashcan': true,
         'readOnly': !Pond.currentAvatar.editable,
         'zoom': {'controls': true, 'wheel': true}});
    const xml = Blockly.Xml.textToDom(Pond.currentAvatar.blockly);
    Blockly.Xml.domToWorkspace(xml, BlocklyInterface.workspace);
    BlocklyInterface.workspace.clearUndo();
    Pond.Duck.setBlocksDisabled(false);
    Pond.Duck.changeTab(Pond.Duck.tabIndex.BLOCKS);
  }

  if (Pond.currentAvatar.js !== undefined) {
    BlocklyInterface.editor['setValue'](Pond.currentAvatar.js, -1);
    Pond.Duck.setBlocksDisabled(true);
    Pond.Duck.changeTab(Pond.Duck.tabIndex.JAVASCRIPT);
  }
  BlocklyInterface.editor['setReadOnly'](!Pond.currentAvatar.editable);
  Pond.Duck.ignoreEditorChanges_ = false;
};

/**
 * Called by the tab bar when a tab is selected.
 * @param {number} index Which tab is now active (0-1).
 */
Pond.Duck.changeTab = function(index) {
  // Change highlighting.
  for (let i = 0; i < Pond.Duck.editorTabs.length; i++) {
    if (index === i) {
      Blockly.utils.dom.addClass(Pond.Duck.editorTabs[i], 'tab-selected');
    } else {
      Blockly.utils.dom.removeClass(Pond.Duck.editorTabs[i], 'tab-selected');
    }
  }
  // Show the correct tab contents.
  const names = ['blockly', 'editor'];
  for (let i = 0; i < names.length; i++) {
    const div = document.getElementById(names[i]);
    div.style.visibility = (i === index) ? 'visible' : 'hidden';
  }
  Blockly.hideChaff(false);
  // Synchronize the documentation popup.
  document.getElementById('docsButton').disabled = false;
  BlocklyGames.LEVEL = (index === Pond.Duck.tabIndex.BLOCKS) ? 11 : 12;
  if (Pond.isDocsVisible_) {
    document.getElementById('frameDocs').src =
        `pond/docs.html?lang=${BlocklyGames.LANG}&mode=${BlocklyGames.LEVEL}`;
  }
  // Synchronize the JS editor.
  if (!Pond.Duck.ignoreEditorChanges_ && !BlocklyInterface.blocksDisabled &&
      index === Pond.Duck.tabIndex.JAVASCRIPT) {
    const code = Blockly.JavaScript.workspaceToCode(BlocklyInterface.workspace);
    Pond.Duck.ignoreEditorChanges_ = true;
    BlocklyInterface.editor['setValue'](code, -1);
    Pond.Duck.ignoreEditorChanges_ = false;
  }
};

/**
 * Change event for JS editor.  Warn the user, then disconnect the link from
 * blocks to JavaScript.
 */
Pond.Duck.editorChanged = function() {
  if (Pond.Duck.ignoreEditorChanges_) {
    return;
  }
  const code = BlocklyInterface.getJsCode();
  if (BlocklyInterface.blocksDisabled) {
    if (!code.trim()) {
      // Reestablish link between blocks and JS.
      BlocklyInterface.workspace.clear();
      Pond.Duck.setBlocksDisabled(false);
    }
  } else {
    if (!BlocklyInterface.workspace.getTopBlocks(false).length ||
        confirm(BlocklyGames.Msg['Games.breakLink'])) {
      // Break link between blocks and JS.
      Pond.Duck.setBlocksDisabled(true);
    } else {
      // Abort change, preserve link.
      Pond.Duck.ignoreEditorChanges_ = true;
      setTimeout(function() {
        BlocklyInterface.editor['setValue'](code, -1);
        Pond.Duck.ignoreEditorChanges_ = false;
      }, 0);
    }
  }
};

/**
 * Enable or disable the ability to use Blockly.
 * @param {boolean} disabled True if Blockly is disabled and JS is to be used.
 */
Pond.Duck.setBlocksDisabled = function(disabled) {
  BlocklyInterface.blocksDisabled = disabled;
  const tab = Pond.Duck.editorTabs[Pond.Duck.tabIndex.BLOCKS];
  if (disabled) {
    Blockly.utils.dom.addClass(tab, 'tab-disabled');
  } else {
    Blockly.utils.dom.removeClass(tab, 'tab-disabled');
  }
};


(function() {
  //<script type="text/javascript" src="pond/duck/default-ducks.js"></script>
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'pond/duck/default-ducks.js';
  document.head.appendChild(script);
})();
window.addEventListener('load', Pond.Duck.init);
