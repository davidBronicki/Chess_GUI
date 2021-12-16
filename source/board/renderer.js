function resquare(){
	let container = document.getElementById("board_grid")

	container.style.width = Math.min(
		window.innerWidth,
		window.innerHeight)
	container.style.height = container.style.width
}

window.addEventListener('load', resquare)
window.addEventListener('resize', resquare)
