
export enum GameState{
	blackToPlay,
	whiteToPlay,
	draw,
	whiteVictory,
	blackVictory
}

export enum EndState{
	undecided,
	draw,
	drawByRepetition,
	fiftyMoveRule,
	stalemate,
	checkmate
}

export interface I_FullBoardPosition{
	move: number
	state: GameState
	ending: EndState
	pieces: string[]
}

export interface I_NewBoardInfo{
	index: number
	position: I_FullBoardPosition
}

export interface I_SquareDelta{
	squareIndex: number
	priorSquare: string
	newSquare: string
}

export interface I_BoardDelta{
	squareDeltas: I_SquareDelta[]
}

export interface I_AvailableMoves{
	targetSquares: number[]
}
