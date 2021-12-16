const chessRules = require("./chess-rules")

test("Index move construction", () => {
	expect(new chessRules.Move(4, 8)).toEqual({
		startSquare: 4,
		endSquare: 8,
		promotionRule: "Q"
	})
})
test("Index move construction with promo", () => {
	expect(new chessRules.Move(4, 8, 'B')).toEqual({
		startSquare: 4,
		endSquare: 8,
		promotionRule: "B"
	})
})
test("Algebraic move construction", () => {
	expect(new chessRules.Move("e1", "a2")).toEqual({
		startSquare: 4,
		endSquare: 8,
		promotionRule: "Q"
	})
})

let startposString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
let startposObject = {
	blackToPlay: false,
	blackLong: true,
	blackShort: true,
	whiteLong: true,
	whiteShort: true,
	enPassantSquare: 64,
	moveNumber: 1,
	plySinceCaptureOrPawnMove: 0,
	pieces: [
		'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',
		'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',
		'_', '_', '_', '_', '_', '_', '_', '_',
		'_', '_', '_', '_', '_', '_', '_', '_',
		'_', '_', '_', '_', '_', '_', '_', '_',
		'_', '_', '_', '_', '_', '_', '_', '_',
		'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',
		'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',
	]
}

test("Test fen startpos", () => {
	expect(new chessRules.Board(startposString)).toEqual(startposObject)
})

test("Test copy startpos", () => {
	expect(new chessRules.Board(undefined, 
		new chessRules.Board(startposString))).toEqual(startposObject)
})

test("Test startpos to fen", () => {
	expect(new chessRules.Board(startposString).toFen()).toEqual(startposString)
})

// test("Game object building and move generation", () => {
// 	expect((new chessRules.Board(startposString)).generateLegalMoves()).toEqual(1)
// })

function fenGen(){
	let game = new chessRules.ChessGame('startpos')

	game.performMove(new chessRules.Move('b1', 'c3'))
	game.performMove(new chessRules.Move('d7', 'd5'))

	// for (const move of game.moves){
	// 	console.log([Math.floor(move.startSquare / 8), move.startSquare % 8,
	// 		Math.floor(move.endSquare / 8), move.endSquare % 8])
	// }

	game.performMove(new chessRules.Move('c3', 'd5'))

	secondFen = game.getBoardState().toFen()

	game.undoMove()
	game.undoMove()
	game.undoMove()

	firstFen = game.getBoardState().toFen()

	return {
		firstFen: firstFen,
		secondFen: secondFen
	}
}

function expectedFens(){
	return {
		firstFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		secondFen: "rnbqkbnr/ppp1pppp/8/3N4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 0 2"
	}
}

test("Game stack handling", () => {
	expect(fenGen()).toEqual(expectedFens())
})

function perft2(fen, depth){
	// let fen = "startpos"
	// let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
	let game = new chessRules.ChessGame(fen)

	let helperF = function(depth){
		if (depth === 1) return game.moves.length
		let output = 0
		for (const move of game.getMoves()){
			game.performMove(move)
			output += helperF(depth - 1)
			game.undoMove()
		}
		return output
	}

	return helperF(depth)
}

// test("Performance test of position 1 with depth = 4", () => {
// 	expect(perft2("startpos", 4)).toEqual(197281)
// })
test("Performance test of position 1 with depth = 3", () => {
	expect(perft2("startpos", 3)).toEqual(8902)
	// expect(perft2("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1", 1)).toEqual(400)
})

// test("Performance test of position 2 with depth = 4", () => {
// 	expect(perft2("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", 4)).toEqual(4085603)
// })
// test("Performance test of position 2 with depth = 2", () => {
// 	expect(perft2("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", 2)).toEqual(2039)
// })

// test("Performance test of position 3 with depth = 4", () => {
// 	expect(perft2("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 4)).toEqual(43238)
// })

// test("Performance test of position 4 with depth = 4", () => {
// 	expect(perft2("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", 4)).toEqual(422333)
// })
