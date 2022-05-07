import {Board, Move, ChessGame} from './chess-rules'

test("move generation test", () => {
	expect(genMoves()).toEqual(expectedMoves())
})

test("Core board test", () => {
	expect(genBoardCore()).toEqual(expectedBoardCore())
})

test("Helper board test", () => {
	expect(genBoardLogic()).toEqual(expectedBoardLogic())
})

test("Game stack handling", () => {
	expect(genGameStack()).toEqual(expectedGameStack())
})

function genMoves(){
	return [
		new Move(4, 8),
		new Move(4, 8, 'B'),
		new Move("e1", "a2")
	]
}

function expectedMoves(){
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

function genBoardCore(){
	let startBoard = new Board("startpos")

	let promotionReadyBoard = new Board("rnbq1bnr/pp1kpPpp/2p5/3p4/8/8/PPPP1PPP/RNBQKBNR w KQ - 1 5")
	let promotingMove = new Move('f7', 'g8', 'Q')
	promotionReadyBoard.performMove(promotingMove)
	let whitePromotedFen = promotionReadyBoard.toFen()

	promotionReadyBoard = new Board("rnbqkbnr/pppp1ppp/8/8/6PP/3P4/PPPKPp2/RNBQ1BNR b kq - 1 5")
	promotingMove = new Move('f2', 'g1', 'Q')
	promotionReadyBoard.performMove(promotingMove)
	let blackPromotedFen = promotionReadyBoard.toFen()
	return [
		startBoard,
		new Board(undefined, startBoard),
		startBoard.toFen(),
		whitePromotedFen,
		blackPromotedFen
	]
}

function expectedBoardCore(){
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
	let whitePromotedFen = "rnbq1bQr/pp1kp1pp/2p5/3p4/8/8/PPPP1PPP/RNBQKBNR b KQ - 0 5"
	let blackPromotedFen = "rnbqkbnr/pppp1ppp/8/8/6PP/3P4/PPPKP3/RNBQ1BqR w kq - 0 6"
	return [
		startposObject,
		startposObject,
		startposString,
		whitePromotedFen,
		blackPromotedFen
	]
}

function genBoardLogic(){
	let output: any = {}

	let startBoard = new Board("startpos")

	let jumpMove = new Move('e2', 'e4')

	output.jumpTrue1 = startBoard._pawnJump(jumpMove)
	output.pawnMoveTrue = startBoard._pawnJump(jumpMove)

	let nonJumpMove1 = new Move('b1', 'c3')
	let nonJumpMove2 = new Move('e2', 'e3')

	output.jumpFalse1 = startBoard._pawnJump(nonJumpMove1)
	output.pawnCaptureMoveFalse = startBoard._pawnOrCaptureMove(nonJumpMove1)
	output.jumpFalse2 = startBoard._pawnJump(nonJumpMove2)

	output.whiteEnPassantingFalse = startBoard._whiteEnPassanting(jumpMove)
	output.blackEnPassantingFalse1 = startBoard._blackEnPassanting(jumpMove)

	startBoard.performMove(jumpMove)

	jumpMove = new Move('e7', 'e5')

	output.jumpTrue2 = startBoard._pawnJump(jumpMove)
	output.blackEnPassantingFalse2 = startBoard._blackEnPassanting(jumpMove)

	let enPassantReadyBoard = new Board("rnbqkbnr/ppp1ppp1/7p/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3")

	let enPassantMove = new Move('e5', 'd6')

	output.whiteEnPassantingTrue = enPassantReadyBoard._whiteEnPassanting(enPassantMove)

	let kingMove = new Move('e1', 'e2')

	output.movingWhiteKingTrue = enPassantReadyBoard._movingWhiteKingFromStartPos(kingMove)
	output.movingWhiteKingFalse = enPassantReadyBoard._movingWhiteKingFromStartPos(enPassantMove)
	output.movingBlackKingFalse1 = enPassantReadyBoard._movingBlackKingFromStartPos(enPassantMove)

	enPassantReadyBoard = new Board("rnbqkbnr/ppp1pppp/8/8/3p4/5N1P/PPPPPPP1/RNBQKB1R w KQkq - 0 3")
	let captureReadyBoard = enPassantReadyBoard.copy()
	enPassantReadyBoard.performMove(new Move('e2', 'e4'))

	enPassantMove = new Move('d4', 'e3')
	let captureMove = new Move('f3', 'd4')

	output.blackEnPassantingTrue = enPassantReadyBoard._blackEnPassanting(enPassantMove)
	output.captureTrue = captureReadyBoard._pawnOrCaptureMove(captureMove)

	kingMove = new Move('e8', 'd7')

	output.movingBlackKingTrue = enPassantReadyBoard._movingBlackKingFromStartPos(kingMove)
	output.movingBlackKingFalse2 = captureReadyBoard._movingBlackKingFromStartPos(captureMove)

	let promotionReadyBoard = new Board("rnbq1bnr/pp1kpPpp/2p5/3p4/8/8/PPPP1PPP/RNBQKBNR w KQ - 1 5")
	let promotingMove = new Move('f7', 'g8', 'Q')
	output.whitePromotingTrue = promotionReadyBoard._whitePromoting(promotingMove)
	output.whitePromotingFalse = promotionReadyBoard._whitePromoting(nonJumpMove1)
	output.blackPromotingFalse1 = promotionReadyBoard._blackPromoting(promotingMove)

	promotionReadyBoard = new Board("rnbqkbnr/pppp1ppp/8/8/6PP/3P4/PPPKPp2/RNBQ1BNR b kq - 1 5")
	promotingMove = new Move('f2', 'g1', 'Q')
	output.blackPromotingTrue = promotionReadyBoard._blackPromoting(promotingMove)
	output.blackPromotingFalse2 = promotionReadyBoard._blackPromoting(jumpMove)

	let castleReady = new Board("rnbqk2r/ppppbppp/4pn2/8/8/4PN2/PPPPBPPP/RNBQK2R w KQkq - 4 4")
	let castleMove = new Move('e1', 'g1')
	output.whiteCastlingTrue = castleReady._movingWhiteKingFromStartPos(castleMove)
	output.whiteCastlingFalse = castleReady._movingWhiteKingFromStartPos(nonJumpMove1)
	output.blackCastlingFalse = castleReady._movingBlackKingFromStartPos(castleMove)

	castleReady.performMove(castleMove)
	castleMove = new Move('e8', 'g8')
	output.blackCastlingTrue = castleReady._movingBlackKingFromStartPos(castleMove)


	let inCheckBoard = new Board("rnbqkbnr/ppppp1pp/5p2/7Q/8/4P3/PPPP1PPP/RNB1KBNR b KQkq - 1 2")

	output.inCheckTrue = inCheckBoard._inCheck(true)
	output.inCheckFalse1 = inCheckBoard._inCheck(false)
	output.inCheckFalse2 = enPassantReadyBoard._inCheck(true)
	

	// _movingWhiteKingFromStartPos todo: castling
	return output
}

function expectedBoardLogic(){
	return {
		"jumpTrue1" : true,
		"jumpTrue2" : true,
		"jumpFalse1" : false,
		"jumpFalse2" : false,
		"pawnMoveTrue" : true,
		"captureTrue" : true,
		"pawnCaptureMoveFalse" : false,
		"whiteEnPassantingTrue" : true,
		"whiteEnPassantingFalse" : false,
		"blackEnPassantingTrue" : true,
		"blackEnPassantingFalse1" : false,
		"blackEnPassantingFalse2" : false,
		"movingWhiteKingTrue" : true,
		"movingWhiteKingFalse" : false,
		"movingBlackKingTrue" : true,
		"movingBlackKingFalse1" : false,
		"movingBlackKingFalse2" : false,
		"whitePromotingTrue" : true,
		"whitePromotingFalse" : false,
		"blackPromotingTrue" : true,
		"blackPromotingFalse1" : false,
		"blackPromotingFalse2" : false,
		"whiteCastlingTrue" : true,
		"whiteCastlingFalse" : false,
		"blackCastlingTrue" : true,
		"blackCastlingFalse" : false,
		"inCheckTrue" : true,
		"inCheckFalse1" : false,
		"inCheckFalse2" : false
	}
}

function genGameStack(){
	let game = new ChessGame('startpos')

	game.performMove(new Move('b1', 'c3'))
	game.performMove(new Move('d7', 'd5'))

	// for (const move of game.moves){
	// 	console.log([Math.floor(move.startSquare / 8), move.startSquare % 8,
	// 		Math.floor(move.endSquare / 8), move.endSquare % 8])
	// }

	game.performMove(new Move('c3', 'd5'))

	let secondFen = game.getBoardState().toFen()

	game.undoMove()
	game.undoMove()
	game.undoMove()

	let firstFen = game.getBoardState().toFen()

	return {
		firstFen: firstFen,
		secondFen: secondFen
	}
}

function expectedGameStack(){
	return {
		firstFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		secondFen: "rnbqkbnr/ppp1pppp/8/3N4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 0 2"
	}
}
