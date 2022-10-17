try
{
    $server = new-object System.IO.Pipes.NamedPipeServerStream('test-server',
        [System.IO.Pipes.PipeDirection]::InOut)

    'Waiting for client connection'
    $server.WaitForConnection()
    'Connection established'

    $pipeReader = new-object System.IO.StreamReader($server)
    $script:pipeWriter = new-object System.IO.StreamWriter($server)
    $pipeWriter.AutoFlush = $true

    while ($true) {
        $what = Read-Host "Send"
        $pipeWriter.WriteLine($what)
        $ans = $pipeReader.ReadLine()
        "Received: $ans"
    }
}
catch {
#    $_
}
finally
{
    'Exiting'
    if ($server -ne $null)
    {
        $server.Dispose()
    }
}
