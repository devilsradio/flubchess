var getGameId = function() {
	if (window.location != '') {
		var newGameId = 'abcdef';
		// window.location = newGameId;
		return newGameId;
	} else {
		// return window.location;
	}
}

$(document).ready(function(){

	var board,
		config,
		gameId = getGameId(),
		game = new Chess();

	var firebase = new Firebase('https://fc9s6ylkgrt.firebaseio-demo.com/' + gameId);

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
		updateBoard();
	};

	var onReset = function() {
		game.reset();
		updateBoard();
	};

	var onUndo = function() {
		game.undo();
		updateBoard();
	}

	var updateBoard = function(fen) {
		if (fen) {
			if (game.fen() != fen) {
				game.load(fen);
				board.position(fen);
			}
		} else {
			board.position(game.fen());
			firebase.child('fen').set(game.fen());
		}
	}

	firebase.child('fen').on('value', function(value) {
		var fen = value.val();
		if (fen) {
			updateBoard(fen);
		}
	});

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