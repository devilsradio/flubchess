var randomId = function() {
	var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	var ret = '';
	for (var ii = 0; ii < 6; ii++) {
		ret += chars[_.random(0, chars.length-1)];
	}
	return ret;
}

var getGameId = function() {
	var path = _.trimLeft(window.location.hash, '#');
	if (path === '') {
		var newGameId = randomId();
		window.location.hash = '#' + newGameId;
		return newGameId;
	} else {
		return path;
	}
}

var alertTitle = function() {
	document.title = '(!) Flubchess';
}

var unalertTitle = function() {
	document.title = 'Flubchess';
}

$(document).ready(function(){

	var board,
		config,
		gameId = getGameId(),
		game = new Chess();

	// Initialize empty chessboard so there's less flashing at start.
	var throwaway = new ChessBoard('board');
	var firebase = new Firebase('https://flubchess.firebaseio.com/' + gameId);

	var onDragStart = function(source, piece, position, orientation) {
		unalertTitle();
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
	}

	var updateBoard = function(fen) {
		if (fen) {
			if (game.fen() != fen) {
				alertTitle();
				game.load(fen);
				board.position(fen);
			}
		} else {
			board.position(game.fen());
			updateFirebase(game.fen());
		}
		if (game.game_over()) {
			$('.game-state').text('Game over');
		} else if (game.turn() === 'b') {
			$('.game-state').text('Black to move');
		} else {
			$('.game-state').text('White to move');
		}
	}

	var updateFirebase = function(fen) {
		firebase.transaction(function(state) {
			if (state === null) {
				return {
					backwards: [(new Chess().fen())],
					forwards: [],
					fen: fen
				}
			} else {
				var oldFen = state.fen;
				if (typeof(state.backwards) == "undefined") {
					state.backwards = [];
				}
				state.backwards.push(oldFen);
				state.fen = fen;
				state.forwards = [];
				return state;
			}
		});
	}

	var goBackwards = function() {
		firebase.transaction(function(state) {
			if (state === null) {
				return null;
			} else if (typeof(state.backwards) == "undefined") {
				return state;
			} else {
				if (typeof(state.forwards) == "undefined") {
					state.forwards = [];
				}
				var newFen = state.backwards.pop();
				state.forwards.unshift(state.fen);
				state.fen = newFen;
				return state;
			}
		});
	}

	var goForwards = function() {
		firebase.transaction(function(state) {
			if (state === null) {
				return null;
			} else if (typeof(state.forwards) == "undefined") {
				return state;
			} else {
				if (typeof(state.backwards) == "undefined") {
					state.backwards = [];
				}
				var newFen = state.forwards.shift();
				state.backwards.push(state.fen);
				state.fen = newFen;
				return state;
			}
		});
	}

	var goReset = function() {
		// do nothing for now
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

	$('.back.button').click(goBackwards);
	$('.forward.button').click(goForwards);

});