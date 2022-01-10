
function setToNewWindow(){
	newPageSourceLocation = '../new_page/index.html'
	document.getElementById('main_content').src = newPageSourceLocation
}

document.addEventListener('DOMContentLoaded', setToNewWindow)

// document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
// 	const isDarkMode = await window.darkMode.toggle()
// 	document.getElementById('theme-source').innerHTML = isDarkMode ? 'Dark' : 'Light'
//   })
  
//   document.getElementById('reset-to-system').addEventListener('click', async () => {
// 	await window.darkMode.system()
// 	document.getElementById('theme-source').innerHTML = 'System'
//   })

