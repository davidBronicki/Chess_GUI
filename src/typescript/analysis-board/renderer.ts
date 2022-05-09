var gameID = -1

var squareElementArray: HTMLElement[] = []
var indicatedSquares: HTMLElement[] = []
var selectedSquare = -1

window.addEventListener('DOMContentLoaded', initBoard)
window.addEventListener('resize', resquare)

function initBoard(){
	window.chess = window.parent.parent.chess

	let boardDiv = window.document.getElementById('board-grid')
	for (let j = 0; j < 8; j++){
		for (let i = 0; i < 8; i++){
			let newDiv = window.document.createElement('div')
			boardDiv.appendChild(newDiv)
			let index = i + (7 - j) * 8
			newDiv.className = (i + j) % 2 === 1 ?
				'darkSquare' :
				'lightSquare'
			squareElementArray.splice(i, 0, newDiv)
			window.chess.indexToAlgebraic(index).then(
				(result: string) => {
					newDiv.id = result
				}
			)
		}
	}
	resquare()
	setStart()
}
function setBoard(position: I_FullBoardPosition){
	for (let i = 0; i < 8; i++){
		for (let j = 0; j < 8; j++){
			let index = i + 8 * j
			let piece = position.pieces[index]
			setSquare(index, piece)
		}
	}
}
function setStart(){
	window.chess.start().then(
		(newBoardInfo: I_NewBoardInfo) => {
			gameID = newBoardInfo.index
			setBoard(newBoardInfo.position)
		}
	)
}

function resetIndicators(){
	for (let indicatingSquare of indicatedSquares){
		indicatingSquare.removeChild(indicatingSquare.lastChild)
		let index = squareElementArray.findIndex((
			value: HTMLElement
		) => {
			return value === indicatingSquare
		})
		if (indicatingSquare.firstChild){
			setClickHandleByIndex(index, handleOccupiedClickEvent)
		}
		else{
			setClickHandleByIndex(index, handleEmptyClickEvent)
		}
	}
	indicatedSquares = []
	selectedSquare = -1
}
function indicateMoveLocations(moveLocations: number[]){
	for (let moveLoc of moveLocations){
		let indicatorElement = window.document.createElement('div')
		indicatorElement.className = 'indicator'
		squareElementArray[moveLoc].appendChild(indicatorElement)
		setClickHandleByIndex(moveLoc, handleIndicatedClickEvent)
		indicatedSquares.push(squareElementArray[moveLoc])
	}
}
function resolveMoveDelta(
	boardDelta: I_BoardDelta
){
	for (let delta of boardDelta.squareDeltas){
		setSquare(delta.squareIndex, delta.newSquare)
	}
}

function handleIndicatedClickEvent(
	event: MouseEvent,
	index: number
){
	let selectedCopy = selectedSquare
	resetIndicators()
	window.chess.performMove(gameID,
		selectedCopy, index).then(resolveMoveDelta)
}
function handleOccupiedClickEvent(
	event: MouseEvent,
	index: number
){
	resetIndicators()
	selectedSquare = index
	window.chess.movesFrom(gameID, index).then(indicateMoveLocations)
}
function handleEmptyClickEvent(
	event: MouseEvent,
	index: number
){
	resetIndicators()
}

function setClickHandleByIndex(
	index: number,
	handle: (event: MouseEvent, index: number) => void
){
	squareElementArray[index].onclick = (event: MouseEvent) => {
		handle(event, index)
	}
}

function pieceToSourceFile(pieceName: string){
	if (pieceName === '_'){
		return ''
	}
	let directory = '../../assets/cburnett/'
	let colorText = ''

	if (pieceName.toLowerCase() === pieceName){
		colorText = 'b'
	}
	else{
		colorText = 'w'
	}

	let pieceText = pieceName.toUpperCase()
	let extension = '.svg'
	
	return directory + colorText + pieceText + extension
}

function resquare(){
	let container = document.getElementById("board-grid")

	container.style.width = Math.min(
		container.parentElement.clientWidth,
		container.parentElement.clientHeight).toString()+"px"
	container.style.height = container.style.width
}
function setSquare(square: number, pieceName: string){
	removeAllChildNodes(squareElementArray[square])
	if (pieceName === '_'){
		setClickHandleByIndex(square, handleEmptyClickEvent)
		return
	}
	let sourceFile = pieceToSourceFile(pieceName)
	let newElement = window.document.createElement('img')
	newElement.className = 'pieceOnBoard'
	newElement.src = sourceFile
	squareElementArray[square].appendChild(newElement)
	setClickHandleByIndex(square, handleOccupiedClickEvent)
}

function removeAllChildNodes(parent: Node) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}
function print(item: string){
	window.parent.parent.logger.log(item)
}
