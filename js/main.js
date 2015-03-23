$(document).ready(function(){

	var board,
		config,
		game = new Chess();

	var firebase = new Firebase('https://fc9s6ylkgrt.firebaseio-demo.com/');

	var onDragStart = function(source, piece, position, orientation) {
		if (
				game.game_over() === true ||
	    		(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
				(game.turn() === 'b' && piece.search(/^w/) !== -1)
			) {
    			return false;
		}
	}

	var onDrop = function(source, target) {
		var move = game.move({
			from: source,
			to: target,
			promotion: 'q' // NOTE: always promote to a queen for example simplicity
		});
		if (move === null) {
			return 'snapback';
		}
		updateStatus();
	};

	var onSnapEnd = function() {
		board.position(game.fen());
	};

	var onReset = function() {
		game.reset();
		board.position(game.fen());
	};

	var onUndo = function() {
		game.undo();
		board.position(game.fen());
	}

	var updateStatus = function() {
		var status = '';

		var moveColor = 'White';
		if (game.turn() === 'b') {
			moveColor = 'Black';
		}

		// checkmate?
		if (game.in_checkmate() === true) {
			status = 'Game over, ' + moveColor + ' is in checkmate.';
		}

		// draw?
		else if (game.in_draw() === true) {
			status = 'Game over, drawn position';
		}

		// game still on
		else {
			status = moveColor + ' to move';

			// check?
			if (game.in_check() === true) {
				status += ', ' + moveColor + ' is in check';
			}
		}
	}

	config = {
		draggable: true,
		position: 'start',
		onDragStart: onDragStart,
		onDrop: onDrop,
		onSnapEnd: onSnapEnd
	};

	board = new ChessBoard('board', config);

	$('.back.button').click(onUndo);
	$('.reset.button').click(onReset);

});