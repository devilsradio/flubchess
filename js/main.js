var randomId = function() {
	var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	var ret = '';
	for (var ii = 0; ii<12; ii++) {
		ret += chars[_.random(0, chars.length)];
	}
	return ret;
}

var getGameId = function() {
	var hash = _.trimLeft(window.location.hash, '#');
	if (hash === '') {
		var newGameId = randomId();
		window.location.hash = newGameId;
		return newGameId;
	} else {
		return hash;
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
		if (game.turn() === 'b') {
			$('.game-state').text('Black to move')
		} else {
			$('.game-state').text('White to move')
		}
	}

	firebase.child('fen').on('value', function(value) {
		var fen = value.val();
		if (typeof(board) === 'undefined') {
			var config = {
				draggable: true,
				position: fen || 'start',
				onDragStart: onDragStart,
				onDrop: onDrop,
				onSnapEnd: onSnapEnd
			};
			board = new ChessBoard('board', config);
		}
		if (fen) {
			updateBoard(fen);
		}
	});

	$('.back.button').click(onUndo);
	$('.reset.button').click(onReset);

});