$DEVMIDServers = @"
AMGDCSNMIDD1
"@ -split '\r\n'

foreach ($MIDServer in $DEVMIDServers)
{
    Copy-Item Downloads\CE-ServiceNow-DEV-Certificate.cer -Destination "\\$MIDServer\C$\IT"
    Invoke-Command -ComputerName $MIDServer -ScriptBlock {
        $ServicePath = (Get-CimInstance -ClassName win32_service | where {$_.name -like "snc_mid*"} | select PathName).pathname
        $ServiceNowAgentLocation =($ServicePath -split 'agent')[0].TrimStart('"') +"agent"
        $keytoolLocation = "$ServiceNowAgentLocation\jre\bin"
        $keytoolCommand = "$ServiceNowAgentLocation\jre\bin"+'\keytool.exe'

        ### You NEED to update the Password before running this
        & $keytoolCommand -import -alias SnMidCertTestDEVApril23 -file "C:\IT\CE-ServiceNow-DEV-Certificate.cer" -keystore "$ServiceNowAgentLocation\jre\lib\security\cacerts" -storepass "changeit" -noprompt

        Get-service snc_mid* | where {$_.Name -notlike "*QA*"} | restart-service
    }
}
