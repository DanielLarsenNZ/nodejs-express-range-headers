    Describe "Valid rfc7233 range response" {

        BeforeAll {
            
            $originUrl = 'https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt'
            $hash = @{
                Response = Invoke-WebRequest -Uri $originUrl -UseBasicParsing -Headers @{ range = 'bytes=0-1023'; 'Accept-Encoding' = 'gzip'} -Verbose -HttpVersion 2.0
            }
        }

        It "Actual content length should be same as requested" {
            $hash.Response.Content.Length | Should -Be 1024
        }

        It "Actual content length should be same as requested" {
            curl -o ./100kb.txt --http2 --range "0-1024"  https://nodejsexpress-aue.azurewebsites.net/ranged/docs/ranged100kb.txt
        }
    }
