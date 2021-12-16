const fs = require('fs')
const deepEqual = require('deep-equal')

const boardDefs = JSON.parse(fs.readFileSync("chess_module/square.json"))
const castleSquares = JSON.parse(fs.readFileSync("chess_module/castle-squares.json"))

//algebraic to index
function ati(index){
	return boardDefs.alg_to_index[index]
}

class Board {
	constructor(fenString, copyThis){
		fenString ??= undefined
		if (fenString != undefined){
			let splitFenString = fenString.split(" ")
			this.pieces = Array(64)
			let rank = 7
			let file = 0
			for (const c of splitFenString[0]){
				if (c === '/'){
					file = 0
					rank -= 1
					continue
				}
				if (c >= '0' && c <= '9'){
					let priorFile = file
					file += parseInt(c)
					for (let i = 8 * rank + priorFile; i < 8 * rank + file; ++i){
						this.pieces[i] = '_'
					}
					continue
				}
				this.pieces[8 * rank + file] = c

				file += 1
			}
			
			this.blackToPlay = splitFenString[1] === 'b'
			this.blackShort = splitFenString[2].includes('k')
			this.blackLong = splitFenString[2].includes('q')
			this.whiteShort = splitFenString[2].includes('K')
			this.whiteLong = splitFenString[2].includes('Q')
			splitFenString[3] = splitFenString[3] === '-' ? '_' : splitFenString[3]
			this.enPassantSquare = ati(splitFenString[3])
			this.plySinceCaptureOrPawnMove = parseInt(splitFenString[4], 10)
			this.moveNumber = parseInt(splitFenString[5])
		}
		else{
			this.pieces = [...copyThis.pieces];
			this.blackToPlay = copyThis.blackToPlay
			this.blackShort = copyThis.blackShort
			this.blackLong = copyThis.blackLong
			this.whiteShort = copyThis.whiteShort
			this.whiteLong = copyThis.whiteLong
			this.enPassantSquare = copyThis.enPassantSquare
			this.plySinceCaptureOrPawnMove = copyThis.plySinceCaptureOrPawnMove
			this.moveNumber = copyThis.moveNumber
		}
	}
	copy(){
		return new Board(undefined, this) 
	}

	toFen(){
		let output = ""

		for (let rank = 7; rank >= 0; --rank){
			let emptyCount = 0
			for (let file = 0; file < 8; ++file){
				let index = file + 8 * rank
				if (this.pieces[index] === '_'){
					++emptyCount
				}
				else{
					if (emptyCount != 0){
						output += emptyCount
						emptyCount = 0
					}
					output += this.pieces[index]
				}
			}
			if (emptyCount != 0){
				output += emptyCount
			}
			if (rank != 0){
				output += '/'
			}
		}

		output += ' '
		if (this.blackToPlay){
			output += 'b'
		} else{
			output += 'w'
		}

		output += ' '
		if (this.whiteShort){
			output += 'K'
		} if (this.whiteLong){
			output += 'Q'
		} if (this.blackShort){
			output += 'k'
		} if (this.blackLong){
			output += 'q'
		} if (output[-1] === ' '){
			output += '-'
		}

		output += ' '
		output += this.enPassantSquare === ati('_') ?
			'-' : boardDefs.index_to_alg[this.enPassantSquare]

		output += ' '
		output += this.plySinceCaptureOrPawnMove

		output += ' '
		output += this.moveNumber

		return output
	}

	_modifyCastleRight(move, attributeString){
		if (castleSquares[attributeString].includes(move.startSquare) ||
			castleSquares[attributeString].includes(move.endSquare)){
			this[attributeString] = false;
		}
	}

	_movingWhiteKingFromStartPos(move){
		return !this.blackToPlay &&
		move.startSquare === ati('e1') &&
		this.pieces[ati('e1')] === 'K'
	}

	_movingBlackKingFromStartPos(move){
		return this.blackToPlay &&
		move.startSquare === ati('e8') &&
		this.pieces[ati('e8')] === 'k'
	}

	_whitePromoting(move){
		return this.pieces[move.startSquare] === 'p' &&
		Math.floor(move.startSquare / 8) === 1
	}

	_blackPromoting(move){
		return this.pieces[move.startSquare] === 'P' &&
		Math.floor(move.startSquare / 8) === 6
	}

	_whiteEnPassanting(move){
		return this.pieces[move.startSquare] === 'P' &&//pawn move
		move.startSquare - move.endSquare % 2 != 0 &&//capture move
		this.pieces[move.endSquare] === '_'//no piece at target
	}

	_blackEnPassanting(move){
		return this.pieces[move.startSquare] === 'p' &&//pawn move
		move.startSquare - move.endSquare % 2 != 0 &&//capture move
		this.pieces[move.endSquare] === '_'//no piece at target
	}

	_pawnJump(move){
		return (this.pieces[move.startSquare] === 'p' &&
			Math.floor(move.startSquare / 8) - Math.floor(move.endSquare / 8) === 2) ||
			(this.pieces[move.startSquare] === 'P' &&
				Math.floor(move.endSquare / 8) - Math.floor(move.startSquare / 8) === 2)
	}

	_pawnOrCaptureMove(move){
		return this.pieces[move.startSquare] === 'p' ||
		this.pieces[move.startSquare] === 'P' ||
		this.pieces[move.endSquare] !== '_'
	}

	_inCheck(blacksKing){
		blacksKing = blacksKing ?? this.blackToPlay
		for (var index = 0; index < 64; ++index){
			if (blacksKing && this.pieces[index] === 'k'){
				break
			}
			if (!blacksKing && this.pieces[index] === 'K'){
				break
			}
		}
		return this.squareUnderAttack(!blacksKing, index)
	}

	squareUnderAttack(byBlack, index){
		let checkColor = byBlack ?
			source => this.pieces[source].toUpperCase() !== this.pieces[source]:
			source => this.pieces[source].toLowerCase() !== this.pieces[source]
		let occupied = source => this.pieces[source] !== '_'

		let isKeyPiece = (source, pieceKey) =>
			this.pieces[source].toLowerCase() === pieceKey

		//knight attacks
		for (const source of knightMovesFrom(index)){
			if (checkColor(source) && isKeyPiece(source, 'n')){
				return true
			}
		}

		//rook attacks
		for (const source of makeSlideMoveIterator(index, 'up')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'down')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'left')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'right')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}

		//bishop attacks
		for (const source of makeSlideMoveIterator(index, 'up right')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'up left')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'down right')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of makeSlideMoveIterator(index, 'down left')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}

		//pawn attacks
		if (byBlack && index < 56){
			if (index % 8 < 7 && this.pieces[index + 8 + 1] === 'p'){
				return true
			}
			if (index % 8 > 0 && this.pieces[index + 8 - 1] === 'p'){
				return true
			}
		}
		if (!byBlack && index >= 8){
			if (index % 8 < 7 && this.pieces[index - 8 + 1] === 'P'){
				return true
			}
			if (index % 8 > 0 && this.pieces[index - 8 - 1] === 'P'){
				return true
			}
		}

		return false
	}

	performMove(move){
		//detect changes to castling rights
		this._modifyCastleRight(move, "blackShort")
		this._modifyCastleRight(move, "blackLong")
		this._modifyCastleRight(move, "whiteShort")
		this._modifyCastleRight(move, "whiteLong")

		//detect en passant
		if (this._whiteEnPassanting(move))
		{
			this.pieces[move.endSquare - 8] = '_'
		}
		if (this._blackEnPassanting(move))
		{
			this.pieces[move.endSquare + 8] = '_'
		}

		//detect promotion
		if (this._whitePromoting(move)){
			this.pieces[move.endSquare] = move.promotionRule.toUpperCase()
			this.pieces[move.startSquare] = '_'
			this.plySinceCaptureOrPawnMove = 0
			this.blackToPlay = !this.blackToPlay
			this.enPassantSquare = ati('_')
			return
		}
		if (this._blackPromoting(move))
		{
			this.pieces[move.endSquare] = move.promotionRule.toLowerCase()
			this.pieces[move.startSquare] = '_'
			this.plySinceCaptureOrPawnMove = 0
			this.moveNumber += 1
			this.blackToPlay = !this.blackToPlay
			this.enPassantSquare = ati('_')
			return
		}

		//detect castling
		if (this._movingBlackKingFromStartPos(move)){
			if (move.endSquare === ati('c8')){
				this.pieces[ati('a8')] = '_'
				this.pieces[ati('d8')] = 'r'
			}
			if (move.endSquare === ati('g8')){
				this.pieces[ati('h8')] = '_'
				this.pieces[ati('f8')] = 'r'
			}
		}
		if (this._movingWhiteKingFromStartPos(move)){
			if (move.endSquare === ati('c1')){
				this.pieces[ati('a1')] = '_'
				this.pieces[ati('d1')] = 'R'
			}
			if (move.endSquare === ati('g1')){
				this.pieces[ati('h1')] = '_'
				this.pieces[ati('f1')] = 'R'
			}
		}

		//detect pawn jump
		if (this._pawnJump(move)){
			this.enPassantSquare = move.endSquare
		}
		else{
			this.enPassantSquare = ati('_')
		}

		//normal move
		++this.plySinceCaptureOrPawnMove
		if (this._pawnOrCaptureMove(move)){
			this.plySinceCaptureOrPawnMove = 0
		}
		if (this.blackToPlay){
			this.moveNumber += 1
		}
		this.pieces[move.endSquare] = this.pieces[move.startSquare]
		this.pieces[move.startSquare] = '_'
		this.blackToPlay = !this.blackToPlay
	}

	moveIsLegal(move){
		//assumed pseudo legal, check if we are in check or if we castled through/out of check

		//bad castle check
		if (this._movingBlackKingFromStartPos(move)){
			if (move.endSquare === ati('c8')){
				return !(this.squareUnderAttack(!this.blackToPlay, move.startSquare) ||
					this.squareUnderAttack(!this.blackToPlay, move.startSquare - 1) ||
					this.squareUnderAttack(!this.blackToPlay, move.endSquare))
			}
			if (move.endSquare === ati('g8')){
				return !(this.squareUnderAttack(!this.blackToPlay, move.startSquare) ||
					this.squareUnderAttack(!this.blackToPlay, move.startSquare + 1) ||
					this.squareUnderAttack(!this.blackToPlay, move.endSquare))
			}
		}
		if (this._movingWhiteKingFromStartPos(move)){
			if (move.endSquare === ati('c1')){
				return !(this.squareUnderAttack(!this.blackToPlay, move.startSquare) ||
					this.squareUnderAttack(!this.blackToPlay, move.startSquare - 1) ||
					this.squareUnderAttack(!this.blackToPlay, move.endSquare))
			}
			if (move.endSquare === ati('g1')){
				return !(this.squareUnderAttack(!this.blackToPlay, move.startSquare) ||
					this.squareUnderAttack(!this.blackToPlay, move.startSquare + 1) ||
					this.squareUnderAttack(!this.blackToPlay, move.endSquare))
			}
		}

		//ends in check
		let boardCopy = this.copy()
		boardCopy.performMove(move)
		return !boardCopy._inCheck(this.blackToPlay)
	}

	_makePseudoBishopSlides(index, friendly, occupied){
		let moves = []
		for (const square of makeSlideMoveIterator(index, 'up right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'up left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'down right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'down left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		return moves
	}

	_makePseudoRookSlides(index, friendly, occupied){
		let moves = []
		for (const square of makeSlideMoveIterator(index, 'up')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'down')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of makeSlideMoveIterator(index, 'left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		return moves
	}

	_makePseudoKnightMoves(index, friendly){
		let moves = []
		for (const square of knightMovesFrom(index)){
			if (friendly(square)) continue
			moves.push(new Move(index, square))
		}
		return moves
	}

	_makePseudoPawnMoves(index, friendly, occupied, isBlack){
		let moves = []
		let pawnIncrement = isBlack ? -8 : 8
		let startRank = isBlack ? 6 : 1
		let promotionRank = isBlack ? 1 : 6
		let enPassantRank = isBlack ? 3 : 4
		let rank = Math.floor(index / 8)
		if (!occupied(index + pawnIncrement)){
			if (rank === promotionRank){
				moves.push(...promotionMoveSuite(index, index + pawnIncrement))
			} else{
				moves.push(new Move(index, index + pawnIncrement))
				if (rank === startRank && !occupied(index + 2 * pawnIncrement)){
					moves.push(new Move(index, index + 2 * pawnIncrement))
				}
			}
		}

		if (index % 8 !== 7 && occupied(index + pawnIncrement + 1) && !friendly(index + pawnIncrement + 1)){
			if (rank === promotionRank){
				moves.push(...promotionMoveSuite(index, index + pawnIncrement + 1))
			} else{
				moves.push(new Move(index, index + pawnIncrement + 1))
			}
		}
		if (index % 8 !== 0 && occupied(index + pawnIncrement - 1) && !friendly(index + pawnIncrement - 1)){
			if (rank === promotionRank){
				moves.push(...promotionMoveSuite(index, index + pawnIncrement - 1))
			} else{
				moves.push(new Move(index, index + pawnIncrement - 1))
			}
		}

		if (rank === enPassantRank && this.enPassantSquare !== 64){
			if (index % 8 + 1 === this.enPassantSquare % 8) {
				moves.push(new Move(index, index + pawnIncrement + 1))
			}
			if (index % 8 === this.enPassantSquare % 8 + 1) {
				moves.push(new Move(index, index + pawnIncrement - 1))
			}
		}
		return moves
	}

	_makePseudoKingMoves(index, friendly){
		let moves = []
		let rank = Math.floor(index / 8)
		let file = index % 8
		if (rank !== 7){//up
			if (!friendly(index + 8)){
				moves.push(new Move(index, index + 8))
			} if (file !== 7 && !friendly(index + 8 + 1)){//up right
				moves.push(new Move(index, index + 8 + 1))
			} if (file !== 0 && !friendly(index + 8 - 1)){//up left
				moves.push(new Move(index, index + 8 - 1))
			}
		}
		if (rank !== 0){//down
			if (!friendly(index - 8)){
				moves.push(new Move(index, index - 8))
			} if (file !== 7 && !friendly(index - 8 + 1)){//up right
				moves.push(new Move(index, index - 8 + 1))
			} if (file !== 0 && !friendly(index - 8 - 1)){//up left
				moves.push(new Move(index, index - 8 - 1))
			}
		}
		if (file !== 7 && !friendly(index + 1)){//right
			moves.push(new Move(index, index + 1))
		}
		if (file !== 0 && !friendly(index - 1)){//left
			moves.push(new Move(index, index - 1))
		}
		return moves
	}

	_makePseudoCastles(isBlack){
		let moves = []
		if (isBlack){
			if (this.blackShort &&
			this.pieces[ati('f8')] === '_' &&
			this.pieces[ati('g8')] === '_'){
				moves.push(new Move(ati('e8'), ati('h8')))
			}
			if (this.blackLong &&
			this.pieces[ati('d8')] === '_' &&
			this.pieces[ati('c8')] === '_' &&
			this.pieces[ati('b8')] === '_'){
				moves.push(new Move(ati('e8'), ati('c8')))
			}
		} else{
			if (this.whiteShort &&
			this.pieces[ati('f1')] === '_' &&
			this.pieces[ati('g1')] === '_'){
				moves.push(new Move(ati('e1'), ati('h1')))
			}
			if (this.whiteLong &&
			this.pieces[ati('d1')] === '_' &&
			this.pieces[ati('c1')] === '_' &&
			this.pieces[ati('b1')] === '_'){
				moves.push(new Move(ati('e1'), ati('c1')))
			}
		}
		return moves
	}

	generateLegalMovesFrom(index){
		if (this.pieces[index] === '_') return []

		let pseudoLegal = []

		let occupied = source => this.pieces[source] !== '_'

		let isBlack = this.pieces[index].toLowerCase() === this.pieces[index]

		let friendly = isBlack ?
			source => this.pieces[source].toUpperCase() !== this.pieces[source] :
			source => this.pieces[source].toLowerCase() !== this.pieces[source]

		//sliding moves
		if (['b', 'q', 'r'].includes(this.pieces[index].toLowerCase())){
			//handle bishop moves
			if (this.pieces[index].toLowerCase() === 'b' ||
			this.pieces[index].toLowerCase() === 'q'){
				pseudoLegal.push(...this._makePseudoBishopSlides(index, friendly, occupied))
			}
	
			//handle rook moves
			if (this.pieces[index].toLowerCase() === 'r' ||
			this.pieces[index].toLowerCase() === 'q'){
				pseudoLegal.push(...this._makePseudoRookSlides(index, friendly, occupied))
			}
		}

		//handle knight moves
		if (this.pieces[index].toLowerCase() === 'n'){
			pseudoLegal.push(...this._makePseudoKnightMoves(index, friendly))
		}
		
		//pawn moves
		if (this.pieces[index].toLowerCase() === 'p'){
			pseudoLegal.push(...this._makePseudoPawnMoves(index, friendly, occupied, isBlack))
		}

		//king moves
		if (this.pieces[index].toLowerCase() === 'k'){
			pseudoLegal.push(...this._makePseudoKingMoves(index, friendly))
			pseudoLegal.push(...this._makePseudoCastles(isBlack))
		}

		let output = []

		for (const move of pseudoLegal){
			if (this.moveIsLegal(move)){
				output.push(move)
			}
		}

		return output
	}

	generateLegalMoves(){
		let moves = []

		let checkColor = this.blackToPlay ?
			source => this.pieces[source].toUpperCase() !== this.pieces[source] :
			source => this.pieces[source].toLowerCase() !== this.pieces[source]

		for (let index = 0; index < 64; ++index){
			if (checkColor(index)){
				moves.push(...this.generateLegalMovesFrom(index))
			}
		}

		return moves
	}
}

function promotionMoveSuite(startIndex, endIndex){
	return [
		new Move(startIndex, endIndex, 'Q'),
		new Move(startIndex, endIndex, 'R'),
		new Move(startIndex, endIndex, 'B'),
		new Move(startIndex, endIndex, 'N')
	]
}

function knightMovesFrom(index){
	output = []
	rank = Math.floor(index / 8)
	file = index % 8
	if (rank + 2 < 8){
		if (file + 1 < 8){
			output.push(index + 16 + 1)
		}
		if (file - 1 >= 0){
			output.push(index + 16 - 1)
		}
	}
	if (rank + 1 < 8){
		if (file + 2 < 8){
			output.push(index + 8 + 2)
		}
		if (file - 2 >= 0){
			output.push(index + 8 - 2)
		}
	}
	if (rank - 2 >= 0){
		if (file + 1 < 8){
			output.push(index - 16 + 1)
		}
		if (file - 1 >= 0){
			output.push(index - 16 - 1)
		}
	}
	if (rank - 1 >= 0){
		if (file + 2 < 8){
			output.push(index - 8 + 2)
		}
		if (file - 2 >= 0){
			output.push(index - 8 - 2)
		}
	}
	return output
}

function makeSlideMoveIterator(baseIndex, directionString){
	directionString = directionString.toLowerCase()
	let up = directionString.includes('up')
	let down = directionString.includes('down')
	let left = directionString.includes('left')
	let right = directionString.includes('right')

	let rankIterator = objectWithRank => {}
	if (up) rankIterator = objectWithRank => {++objectWithRank.rank}
	if (down) rankIterator = objectWithRank => {--objectWithRank.rank}
	// let rankIterator = inputRank => {}
	// if (up) rankIterator = inputRank => {++inputRank}
	// if (down) rankIterator = inputRank => {--inputRank}

	let rankOutOfRange = inputRank => false
	if (up) rankOutOfRange = inputRank => inputRank >= 8
	if (down) rankOutOfRange = inputRank => inputRank < 0

	let fileIterator = objectWithFile => {}
	if (right) fileIterator = objectWithFile => {++objectWithFile.file}
	if (left) fileIterator = objectWithFile => {--objectWithFile.file}
	// let fileIterator = inputFile => {}
	// if (right) fileIterator = inputFile => {++inputFile}
	// if (left) fileIterator = inputFile => {--inputFile}

	let fileOutOfRange = inputFile => false
	if (right) fileOutOfRange = inputFile => inputFile >= 8
	if (left) fileOutOfRange = inputFile => inputFile < 0

	let rank = Math.floor(baseIndex / 8)
	let file = baseIndex % 8

	return {
		rank: rank,
		file: file,
		next: function(){
			rankIterator(this)
			fileIterator(this)
			if (rankOutOfRange(this.rank) || fileOutOfRange(this.file)){
				return {
					// done: true,
					// value: 64
					done: true
				}
			} else{
				return {
					// done: false,
					// value: 8 * this.rank + this.file
					value: 8 * this.rank + this.file
				}
			}
		},
		[Symbol.iterator]: function(){
			return this
		}
	}
}

class Move{
	constructor(startSquare, endSquare, promotionRule){
		this.startSquare = typeof startSquare === "number" ?
			startSquare : ati(startSquare)
		this.endSquare = typeof endSquare === "number" ?
			endSquare : ati(endSquare)
		this.promotionRule = promotionRule ?? 'Q'
	}
}

class ChessGame {
	constructor(fenString="startpos"){
		if (fenString === "startpos"){
			fenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
		}
		this.boardStateList = [new Board(fenString)]
		this.moves = this.boardStateList[0].generateLegalMoves()
	}

	performMove(move, force = false){
		if (!force && !this.moves.some(element => deepEqual(element, move))){
			return false
		}
		this.boardStateList.push(this.boardStateList.at(-1).copy())
		this.boardStateList.at(-1).performMove(move)
		this.moves = this.boardStateList.at(-1).generateLegalMoves()
		return true
	}

	undoMove(){
		if (this.boardStateList.length <= 1) return false
		this.boardStateList.pop()
		this.moves = this.boardStateList.at(-1).generateLegalMoves()
		return true
	}

	getMoves(){
		return [...this.moves]
	}

	getMovesFrom(square){
		if (typeof square !== 'number'){
			square = ati(square)
		}
		return this.boardStateList.generateLegalMovesFrom(square)
	}

	getBoardState(){
		return this.boardStateList.at(-1)
	}
}

module.exports = {
	Board: Board,
	Move: Move,
	ChessGame: ChessGame
}
