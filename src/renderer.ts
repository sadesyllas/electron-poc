const input = document.getElementById('input');

window.electronAPI.onInput((event: any, args: any) => {
  if (input) {
    input.innerText = args;
  }
});

window.electronAPI.onIOError((error?: Error) => {
  const { name, message } = error ?? {};
  const alert = name || message ? `${name} ${message}` : 'An error occured with IO';
  window.alert(alert);
});
