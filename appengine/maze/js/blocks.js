/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Blocks for Maze game.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Maze.Blocks');

goog.require('Blockly');
goog.require('Blockly.JavaScript');
goog.require('Blockly.FieldDropdown');
goog.require('Blockly.FieldImage');
goog.require('BlocklyGames');
goog.require('BlocklyGames.Msg');


/**
 * Common HSV hue for all movement blocks.
 */
Maze.Blocks.MOVEMENT_HUE = 290;

/**
 * HSV hue for loop block.
 */
Maze.Blocks.LOOPS_HUE = 120;

/**
 * Common HSV hue for all logic blocks.
 */
Maze.Blocks.LOGIC_HUE = 210;

/**
 * Left turn arrow to be appended to messages.
 */
Maze.Blocks.LEFT_TURN = ' \u21BA';

/**
 * Left turn arrow to be appended to messages.
 */
Maze.Blocks.RIGHT_TURN = ' \u21BB';

// Extensions to Blockly's existing blocks and JavaScript generator.

Blockly.Blocks['maze_moveForward'] = {
  /**
   * Block for moving forward.
   * @this {Blockly.Block}
   */
  init: function() {
    this.jsonInit({
      "message0": BlocklyGames.Msg['Maze.moveForward'],
      "previousStatement": null,
      "nextStatement": null,
      "colour": Maze.Blocks.MOVEMENT_HUE,
      "tooltip": BlocklyGames.Msg['Maze.moveForwardTooltip']
    });
  }
};

Blockly.JavaScript['maze_moveForward'] = function(block) {
  // Generate JavaScript for moving forward.
  return 'moveForward(\'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['maze_turn'] = {
  /**
   * Block for turning left or right.
   * @this {Blockly.Block}
   */
  init: function() {
    const DIRECTIONS =
        [[BlocklyGames.Msg['Maze.turnLeft'], 'turnLeft'],
         [BlocklyGames.Msg['Maze.turnRight'], 'turnRight']];
    // Append arrows to direction messages.
    DIRECTIONS[0][0] += Maze.Blocks.LEFT_TURN;
    DIRECTIONS[1][0] += Maze.Blocks.RIGHT_TURN;
    this.setColour(Maze.Blocks.MOVEMENT_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(BlocklyGames.Msg['Maze.turnTooltip']);
  }
};

Blockly.JavaScript['maze_turn'] = function(block) {
  // Generate JavaScript for turning left or right.
  const dir = block.getFieldValue('DIR');
  return dir + '(\'block_id_' + block.id + '\');\n';
};

Blockly.Blocks['maze_if'] = {
  /**
   * Block for 'if' conditional if there is a path.
   * @this {Blockly.Block}
   */
  init: function() {
    const DIRECTIONS =
        [[BlocklyGames.Msg['Maze.pathAhead'], 'isPathForward'],
         [BlocklyGames.Msg['Maze.pathLeft'], 'isPathLeft'],
         [BlocklyGames.Msg['Maze.pathRight'], 'isPathRight']];
    // Append arrows to direction messages.
    DIRECTIONS[1][0] += Maze.Blocks.LEFT_TURN;
    DIRECTIONS[2][0] += Maze.Blocks.RIGHT_TURN;
    this.setColour(Maze.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.Msg['Maze.doCode']);
    this.setTooltip(BlocklyGames.Msg['Maze.ifTooltip']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_if'] = function(block) {
  // Generate JavaScript for 'if' conditional if there is a path.
  const argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  const code = 'if (' + argument + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Blocks['maze_ifElse'] = {
  /**
   * Block for 'if/else' conditional if there is a path.
   * @this {Blockly.Block}
   */
  init: function() {
    const DIRECTIONS =
        [[BlocklyGames.Msg['Maze.pathAhead'], 'isPathForward'],
         [BlocklyGames.Msg['Maze.pathLeft'], 'isPathLeft'],
         [BlocklyGames.Msg['Maze.pathRight'], 'isPathRight']];
    // Append arrows to direction messages.
    DIRECTIONS[1][0] += Maze.Blocks.LEFT_TURN;
    DIRECTIONS[2][0] += Maze.Blocks.RIGHT_TURN;
    this.setColour(Maze.Blocks.LOGIC_HUE);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(DIRECTIONS), 'DIR');
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.Msg['Maze.doCode']);
    this.appendStatementInput('ELSE')
        .appendField(BlocklyGames.Msg['Maze.elseCode']);
    this.setTooltip(BlocklyGames.Msg['Maze.ifelseTooltip']);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};

Blockly.JavaScript['maze_ifElse'] = function(block) {
  // Generate JavaScript for 'if/else' conditional if there is a path.
  const argument = block.getFieldValue('DIR') +
      '(\'block_id_' + block.id + '\')';
  const branch0 = Blockly.JavaScript.statementToCode(block, 'DO');
  const branch1 = Blockly.JavaScript.statementToCode(block, 'ELSE');
  const code = 'if (' + argument + ') {\n' + branch0 +
             '} else {\n' + branch1 + '}\n';
  return code;
};

Blockly.Blocks['maze_forever'] = {
  /**
   * Block for repeat loop.
   * @this {Blockly.Block}
   */
  init: function() {
    this.setColour(Maze.Blocks.LOOPS_HUE);
    this.appendDummyInput()
        .appendField(BlocklyGames.Msg['Maze.repeatUntil'])
        .appendField(new Blockly.FieldImage(Maze.SKIN.marker, 12, 16));
    this.appendStatementInput('DO')
        .appendField(BlocklyGames.Msg['Maze.doCode']);
    this.setPreviousStatement(true);
    this.setTooltip(BlocklyGames.Msg['Maze.whileTooltip']);
  }
};

Blockly.JavaScript['maze_forever'] = function(block) {
  // Generate JavaScript for repeat loop.
  let branch = Blockly.JavaScript.statementToCode(block, 'DO');
  if (Blockly.JavaScript.INFINITE_LOOP_TRAP) {
    branch = Blockly.JavaScript.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'block_id_' + block.id + '\'') + branch;
  }
  return 'while (notDone()) {\n' + branch + '}\n';
};
