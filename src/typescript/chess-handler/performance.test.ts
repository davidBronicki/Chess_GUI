import {Board, Move, ChessGame} from './chess-rules'

test("Performance test", () => {
	expect(genPerformanceTests()).toEqual(expectedPerformanceTests())
})

function genPerformanceTests(){
	return {
		"pos1_depth3" : perft("startpos", 3),
		"pos1_depth4" : perft("startpos", 4),
		"pos2_depth4" : perft("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", 4),
		"pos3_depth4" : perft("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", 4),
		"pos4_depth4" : perft("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", 4),
		"pos5_depth3" : perft("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", 3)
	}
}

function expectedPerformanceTests(){
	return {
		"pos1_depth3" : 8902,
		"pos1_depth4" : 197281,
		"pos2_depth4" : 4085603,
		"pos3_depth4" : 43238,
		"pos4_depth4" : 422333,
		"pos5_depth3" : 62379
	}
}

function perft(fen: string, depth: number){
	// let fen = "startpos"
	// let fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
	let game = new ChessGame(fen)

	let helperF = function(depth: number){
		if (depth === 1) return game.moves.length
		let output = 0
		let tempMoves = game.getMoves()
		for (const move of game.getMoves()){
			game.performMove(move)
			output += helperF(depth - 1)
			game.undoMove()
		}
		return output
	}

	return helperF(depth)
}
