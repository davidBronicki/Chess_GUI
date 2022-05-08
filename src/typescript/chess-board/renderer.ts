var gameIndex = -1

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

function setBoard(position: any){
	for (let i = 0; i < 8; i++){
		for (let j = 0; j < 8; j++){
			let index = i + 8 * j
			let piece = position.pieces[index]
			if (piece === '_'){
				continue
			}
			let sourceFile = pieceToSourceFile(piece)
			let newElement = window.document.createElement('img')
			newElement.src = sourceFile
			newElement.style.width = '100%'
			window.chess.indexToAlgebraic(index).then(
				(result: string) => {
					let square = window.document.getElementById(result)
					square.appendChild(newElement)
				}
			)
		}
	}
}

function setStart(){
	window.chess.start().then(
		(newBoardInfo: any) => {
			gameIndex = newBoardInfo.index
			setBoard(newBoardInfo.position)
		}
	)
}

function invertBoard(){

}

function resquare(){
	let container = document.getElementById("board-grid")

	container.style.width = Math.min(
		window.innerWidth,
		window.innerHeight).toString()
	container.style.height = container.style.width
}

window.addEventListener('DOMContentLoaded', initBoard)
window.addEventListener('resize', resquare)

// mainBoardState = window.board.blank()

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

function removeAllChildNodes(parent: Node) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}
