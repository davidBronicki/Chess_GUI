function resquare(){
	let container = document.getElementById("board_grid")

	container.style.width = Math.min(
		window.innerWidth,
		window.innerHeight)
	container.style.height = container.style.width

	window.log.log("fuck")
}

window.addEventListener('DOMContentLoaded', resquare)
window.addEventListener('resize', resquare)
// document.addEventListener('resize', resquare)

mainBoardState = window.board.blank()

function pieceToSourceFile(pieceName){
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

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function setSquareContent(squareName){
	let container = document.getElementById(squareName)
	let image = document.createElement('img')
	image.src = pieceToSourceFile(mainBoardState.getPieceAt(squareName))

	removeAllChildNodes(container)
	container.appendChild(image)
}

function resetBoard(e){
	for (let i = 0; i < 64; ++i){
		setSquareContent(i)
	}
	console.log('fucking bullshit')
}

document.addEventListener('resetBoard', resetBoard)

// window.addEventListener('DOMContentLoaded', resetBoard)

document.dispatchEvent(new Event('resetBoard'))
