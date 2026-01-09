document.getElementById('openApp').addEventListener('click', () => {
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 1400,
    height: 850,
    focused: true
  });
});