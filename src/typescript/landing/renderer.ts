
document.getElementById(
	"new-page-button").addEventListener(
		'click', ()=>{
	window.parent.logger.log('used')
	window.location.href = "../html/analysis-board.html"
})
