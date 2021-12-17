const chessRules = require("./chess-rules")

test("Move type tests", () => {
	expect(moveTest()).toEqual(moveResults())
})

test("Board functions test", () => {
	expect(boardTest()).toEqual(boardResults())
})

// test("Game object building and move generation", () => {
// 	expect((new chessRules.Board(startposString)).generateLegalMoves()).toEqual(1)
// })

test("Game stack tests", () => {
	expect(stackTest()).toEqual(stackResults())
})

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

function moveTest(){
	return [
		new chessRules.Move(4, 8),
		new chessRules.Move(4, 8, 'B'),
		new chessRules.Move("e1", "a2")
	]
}

function moveResults(){
	return [
		{
			startSquare: 4,
			endSquare: 8,
			promotionRule: "Q"
		},
		{
			startSquare: 4,
			endSquare: 8,
			promotionRule: "B"
		},
		{
			startSquare: 4,
			endSquare: 8,
			promotionRule: "Q"
		}
	]
}

function boardTest(){
	let board = new chessRules.Board('startpos')
	let fen1 = board.toFen()
	board = new chessRules.Board(board)
	let fen2 = board.toFen()
	let board = new chessRules.Board("rnbqkbnr/pppp1ppp/4p3/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 2")
	return [
		new chessRules.Board('startpos'),
		new chessRules.Board(undefined, 
			new chessRules.Board(startposString)),
		new chessRules.Board(startposString).toFen()
	]
}

function boardResults(){
	return [
		startposObject,
		startposObject,
		"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
	]
}

function stackTest(){
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

function stackResults(){
	return {
		firstFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		secondFen: "rnbqkbnr/ppp1pppp/8/3N4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 0 2"
	}
}

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

var startposObject = {
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
