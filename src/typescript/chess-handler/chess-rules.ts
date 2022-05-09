import deepEqual from 'fast-deep-equal/es6'

import boardDefs from './square.json'
import castleSquares from './castle-squares.json'

import * as interfaces from './chess-ipc-types'

//useful thing
function dynamicPropertySetter<
	Type,
	K extends keyof Type,
	V extends Type[K]>(
		thing: Type,
		propertyName: K,
		newValue: V) {
    thing[propertyName] = newValue
}

//algebraic to index
export function ati(index: string): number{
	return boardDefs.alg_to_index[
		index as keyof typeof boardDefs.alg_to_index]
}

export function ita(index: number): string{
	return boardDefs.index_to_alg[index]
}

export class Board {
	pieces: Array<string>
	blackToPlay: boolean
	blackShort: boolean
	blackLong: boolean
	whiteShort: boolean
	whiteLong: boolean
	enPassantSquare: number
	plySinceCaptureOrPawnMove: number
	moveNumber: number
	constructor(
		fenString?: string,
		copyThis?: Board){

		if (fenString !== undefined &&
			copyThis !== undefined){
			throw new TypeError("at least one undefined parameter must be passed to Board")
		}
		
		fenString ??= undefined
		if (fenString === "startpos"){
			fenString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
		}
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
			splitFenString[3] = splitFenString[3] === '-' ?
				'_' :
				splitFenString[3]
			this.enPassantSquare = ati(splitFenString[3])
			this.plySinceCaptureOrPawnMove = parseInt(
				splitFenString[4], 10)
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

	equivalentPositions(otherBoard: Board){
		for (let i = 0; i < 64; ++i){
			if (this.pieces[i] !== otherBoard.pieces[i]){
				return false
			}
		}

		return (this.blackToPlay === otherBoard.blackToPlay &&
			this.blackLong === otherBoard.blackLong &&
			this.blackShort === otherBoard.blackShort &&
			this.whiteLong === otherBoard.whiteLong &&
			this.whiteShort === otherBoard.whiteShort &&
			this.enPassantSquare === otherBoard.enPassantSquare)
	}

	_modifyCastleRight(this: Board, move: Move, attributeString: string){
		if (castleSquares[
				attributeString as keyof typeof castleSquares].
					includes(move.startSquare) ||
			castleSquares[
				attributeString as keyof typeof castleSquares].
					includes(move.endSquare)){
			dynamicPropertySetter(
				this,
				attributeString as keyof Board,
				false)
		}
	}

	_movingWhiteKingFromStartPos(move: Move){
		return !this.blackToPlay &&
		move.startSquare === ati('e1') &&
		this.pieces[ati('e1')] === 'K'
	}

	_movingBlackKingFromStartPos(move: Move){
		return this.blackToPlay &&
		move.startSquare === ati('e8') &&
		this.pieces[ati('e8')] === 'k'
	}

	_whitePromoting(move: Move){
		return this.pieces[move.startSquare] === 'P' &&
		Math.floor(move.startSquare / 8) === 6
	}

	_blackPromoting(move: Move){
		return this.pieces[move.startSquare] === 'p' &&
		Math.floor(move.startSquare / 8) === 1
	}

	_whiteEnPassanting(move: Move){
		return this.pieces[move.startSquare] === 'P' &&//pawn move
		(move.startSquare - move.endSquare) % 2 !== 0 &&//capture move
		this.pieces[move.endSquare] === '_'//no piece at target
	}

	_blackEnPassanting(move: Move){
		return this.pieces[move.startSquare] === 'p' &&//pawn move
		(move.startSquare - move.endSquare) % 2 !== 0 &&//capture move
		this.pieces[move.endSquare] === '_'//no piece at target
	}

	_pawnJump(move: Move){
		return (this.pieces[move.startSquare] === 'p' &&
			Math.floor(move.startSquare / 8) - Math.floor(move.endSquare / 8) === 2) ||
			(this.pieces[move.startSquare] === 'P' &&
				Math.floor(move.endSquare / 8) - Math.floor(move.startSquare / 8) === 2)
	}

	_pawnOrCaptureMove(move: Move){
		return this.pieces[move.startSquare] === 'p' ||
		this.pieces[move.startSquare] === 'P' ||
		this.pieces[move.endSquare] !== '_'
	}

	_inCheck(blacksKing?: boolean){
		blacksKing ??= this.blackToPlay
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

	squareUnderAttack(byBlack: boolean, index: number){
		let checkColor = byBlack ?
			(source: number) => {
				return this.pieces[source].toUpperCase() !== this.pieces[source]} :
			(source: number) => {
				return this.pieces[source].toLowerCase() !== this.pieces[source]}
		let occupied = (source: number) => {
			return this.pieces[source] !== '_'}

		let isKeyPiece = (source: number, pieceKey: string) => {
			return this.pieces[source].toLowerCase() === pieceKey}

		//knight attacks
		for (const source of knightMovesFrom(index)){
			if (checkColor(source) && isKeyPiece(source, 'n')){
				return true
			}
		}

		//rook attacks
		for (const source of new SlideMoveIterator(index, 'up')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'down')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'left')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'right')){
			if (checkColor(source) && (isKeyPiece(source, 'r') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}

		//bishop attacks
		for (const source of new SlideMoveIterator(index, 'up right')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'up left')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'down right')){
			if (checkColor(source) && (isKeyPiece(source, 'b') || isKeyPiece(source, 'q'))){
				return true
			}
			if (occupied(source)) break
		}
		for (const source of new SlideMoveIterator(index, 'down left')){
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

	performMove(move: Move){
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

	moveIsLegal(move: Move){
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

	_makePseudoBishopSlides(
		index: number,
		friendly: (index: number) => boolean,
		occupied: (index: number) => boolean){

		let moves: Array<Move> = []
		for (const square of new SlideMoveIterator(index, 'up right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'up left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'down right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'down left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		return moves
	}

	_makePseudoRookSlides(
		index: number,
		friendly: (index: number) => boolean,
		occupied: (index: number) => boolean){

		let moves = []
		for (const square of new SlideMoveIterator(index, 'up')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'down')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'right')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		for (const square of new SlideMoveIterator(index, 'left')){
			if (friendly(square)) break
			moves.push(new Move(index, square))
			if (occupied(square)) break
		}
		return moves
	}

	_makePseudoKnightMoves(
		index: number,
		friendly: (index: number) => boolean){

		let moves = []
		for (const square of knightMovesFrom(index)){
			if (friendly(square)) continue
			moves.push(new Move(index, square))
		}
		return moves
	}

	_makePseudoPawnMoves(
		index: number,
		friendly: (index: number) => boolean,
		occupied: (index: number) => boolean,
		isBlack: boolean){

		let moves = []
		let pawnIncrement = isBlack ? -8 : 8
		let startRank = isBlack ? 6 : 1
		let promotionRank = isBlack ? 1 : 6
		let enPassantRank = isBlack ? 3 : 4
		let rank = Math.floor(index / 8)
		let file = index % 8
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

		if (file !== 7 && occupied(index + pawnIncrement + 1) && !friendly(index + pawnIncrement + 1)){
			if (rank === promotionRank){
				moves.push(...promotionMoveSuite(index, index + pawnIncrement + 1))
			} else{
				moves.push(new Move(index, index + pawnIncrement + 1))
			}
		}
		if (file !== 0 && occupied(index + pawnIncrement - 1) && !friendly(index + pawnIncrement - 1)){
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

	_makePseudoKingMoves(
		index: number,
		friendly: (index: number) => boolean){

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

	_makePseudoCastles(isBlack: boolean){
		let moves = []
		if (isBlack){
			if (this.blackShort &&
			this.pieces[ati('f8')] === '_' &&
			this.pieces[ati('g8')] === '_'){
				moves.push(new Move(ati('e8'), ati('g8')))
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
				moves.push(new Move(ati('e1'), ati('g1')))
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

	generateLegalMovesFrom(index: number){
		if (this.pieces[index] === '_') return []

		let pseudoLegal = []

		let occupied = (source: number) => this.pieces[source] !== '_'

		let isBlack = this.pieces[index].toLowerCase() === this.pieces[index]

		let friendly = isBlack ?
			(source: number) => this.pieces[source].toUpperCase() !== this.pieces[source] :
			(source: number) => this.pieces[source].toLowerCase() !== this.pieces[source]

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
			(source: number) => this.pieces[source].toUpperCase() !== this.pieces[source] :
			(source: number) => this.pieces[source].toLowerCase() !== this.pieces[source]

		for (let index = 0; index < 64; ++index){
			if (checkColor(index)){
				moves.push(...this.generateLegalMovesFrom(index))
			}
		}

		return moves
	}
}

function promotionMoveSuite(startIndex: number, endIndex: number){
	return [
		new Move(startIndex, endIndex, 'Q'),
		new Move(startIndex, endIndex, 'R'),
		new Move(startIndex, endIndex, 'B'),
		new Move(startIndex, endIndex, 'N')
	]
}

function knightMovesFrom(index: number){
	let output: Array<number> = []
	let rank = Math.floor(index / 8)
	let file = index % 8
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

class SlideMoveIterator implements Iterable<number>, Iterator<number>{
	rank: number
	file: number
	next: () => IteratorResult<number>
	[Symbol.iterator](): Iterator<number>{
		return this
	}

	constructor(
		baseIndex: number,
		directionString: string){
		
		directionString = directionString.toLowerCase()
		let up = directionString.includes('up')
		let down = directionString.includes('down')
		let left = directionString.includes('left')
		let right = directionString.includes('right')

		let rankIterator = (objectWithRank: SlideMoveIterator) => {}
		if (up) rankIterator = objectWithRank => {++objectWithRank.rank}
		if (down) rankIterator = objectWithRank => {--objectWithRank.rank}
		// let rankIterator = inputRank => {}
		// if (up) rankIterator = inputRank => {++inputRank}
		// if (down) rankIterator = inputRank => {--inputRank}

		let rankOutOfRange = (inputRank: number) => false
		if (up) rankOutOfRange = inputRank => inputRank >= 8
		if (down) rankOutOfRange = inputRank => inputRank < 0

		let fileIterator = (objectWithFile: SlideMoveIterator) => {}
		if (right) fileIterator = objectWithFile => {++objectWithFile.file}
		if (left) fileIterator = objectWithFile => {--objectWithFile.file}
		// let fileIterator = inputFile => {}
		// if (right) fileIterator = inputFile => {++inputFile}
		// if (left) fileIterator = inputFile => {--inputFile}

		let fileOutOfRange = (inputRank: number) => false
		if (right) fileOutOfRange = inputFile => inputFile >= 8
		if (left) fileOutOfRange = inputFile => inputFile < 0

		this.rank = Math.floor(baseIndex / 8)
		this.file = baseIndex % 8

		this.next = function(this: SlideMoveIterator){
			rankIterator(this)
			fileIterator(this)
			if (rankOutOfRange(this.rank) || fileOutOfRange(this.file)){
				return {
					value: 64,
					done: true
				}
			} else{
				return {
					value: 8 * this.rank + this.file,
					done: false
				}
			}
		}
	}
}

export class Move{
	startSquare: number
	endSquare: number
	promotionRule: string
	constructor(
		startSquare: number | string,
		endSquare: number | string,
		promotionRule?: string){
		this.startSquare = typeof startSquare === "number" ?
			startSquare : ati(startSquare)
		this.endSquare = typeof endSquare === "number" ?
			endSquare : ati(endSquare)
		this.promotionRule = promotionRule ?? 'Q'
	}
}

class GameState{
	state: interfaces.GameState
	ending: interfaces.EndState
}

export class ChessGame {
	boardStateList: Array<Board>
	moves: Array<Move>
	constructor(fenString="startpos"){
		this.boardStateList = [new Board(fenString)]
		this.moves = this.boardStateList[0].generateLegalMoves()
	}

	adjudicateMove(move: Move){
		return "legal"
	}

	adjudicatePosition(): GameState{
		if (this.boardStateList.at(-1).plySinceCaptureOrPawnMove === 100){
			return {
				state: interfaces.GameState.draw,
				ending: interfaces.EndState.fiftyMoveRule
			}
		}
		let blackToPlay = this.boardStateList.at(-1).blackToPlay
		if (this.moves.length === 0){
			if (this.boardStateList.at(-1)._inCheck()){
				return {
					state: blackToPlay ?
						interfaces.GameState.whiteVictory :
						interfaces.GameState.blackVictory,
					ending: interfaces.EndState.checkmate
				}
				// return this.boardStateList.at(-1).blackToPlay ?
				// 	"white wins" :
				// 	"black wins"
			}
			return {
				state: interfaces.GameState.draw,
				ending: interfaces.EndState.stalemate
			}
			// return "draw stalemate"
		}
		let repetitionCount = 0
		for (let i = this.boardStateList.length - 1;
			i >= Math.max(0, this.boardStateList.length - this.boardStateList.at(-1).plySinceCaptureOrPawnMove - 1);
			--i){
			if (this.boardStateList[i].equivalentPositions(this.boardStateList.at(-1))){
				++repetitionCount;
			}
		}
		if (repetitionCount >= 3){
			return {
				state: interfaces.GameState.draw,
				ending: interfaces.EndState.drawByRepetition
			}
			// return "draw repetition"
		}
		return {
			state: blackToPlay ?
				interfaces.GameState.blackToPlay :
				interfaces.GameState.whiteToPlay,
			ending: interfaces.EndState.undecided
		}
		// return "good"
	}

	performMove(move: Move, force = false){
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

	getMovesFrom(square: string | number){
		if (typeof square !== 'number'){
			square = ati(square)
		}
		return this.boardStateList.at(-1).
			generateLegalMovesFrom(square)
	}

	getBoardState(){
		return this.boardStateList.at(-1)
	}

	getPieceAt(square: string | number){
		if (typeof square !== 'number'){
			square = ati(square)
		}
		return this.boardStateList.at(-1).pieces[square]
	}
}

export function generatePositionData(
	game: ChessGame
): interfaces.I_FullBoardPosition{
	let state = game.adjudicatePosition()
	return {
		move: game.boardStateList.length / 2,
		state: state.state,
		ending: state.ending,
		pieces: game.boardStateList.at(-1).pieces
	}
}

export function generateNewPositionData(
	game: ChessGame,
	gameIndex: number
): interfaces.I_NewBoardInfo{
	return {
		index: gameIndex,
		position: generatePositionData(game)
	}
}

export function generateLegalMoves(
	game: ChessGame,
	sourceSquare: number
) {
	let outputMoves: number[] = []
	for (let move of game.moves){
		if (move.startSquare === sourceSquare){
			outputMoves.push(move.endSquare)
		}
	}
	return outputMoves
}

export function isPromoting(
	game: ChessGame,
	sourceSquare: number,
	targetSquare: number
): boolean{
	let currentBoardState = game.getBoardState()
	let blackToPlay = currentBoardState.blackToPlay
	if (blackToPlay){
		return currentBoardState._blackPromoting(
			new Move(sourceSquare, targetSquare)
		)
	}
	else{
		return currentBoardState._whitePromoting(
			new Move(sourceSquare, targetSquare)
		)
	}
}

export function generateMoveDeltas(
	game: ChessGame
): interfaces.I_BoardDelta{
	let currentState = game.getBoardState().pieces
	let previousState = game.boardStateList.at(-2).pieces
	let squareDeltas: interfaces.I_SquareDelta[] = []
	for (let i = 0; i < 64; i++){
		if (currentState[i] !== previousState[i]){
			squareDeltas.push({
				squareIndex: i,
				priorSquare: previousState[i],
				newSquare: currentState[i]
			})
		}
	}
	return {
		squareDeltas: squareDeltas
	}
}

export function generateNullDelta(): interfaces.I_BoardDelta{
	return {
		squareDeltas: []
	}
}
