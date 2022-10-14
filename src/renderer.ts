const input = document.getElementById('input');

window.appInput.onInput((event: any, args: any) => {
  if (input) {
    input.innerText = args;
  }
});

window.appInput.onIOError((error?: Error) => {
  const { name, message } = error ?? {};
  const alert = name || message ? `${name} ${message}` : 'An error occured with IO';
  window.alert(alert);
});
