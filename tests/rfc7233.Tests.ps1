$originUrl = ''

BeforeAll {
    
}

Describe "Valid rfc7233 range response" {
    Invoke-WebRequest 
    It "Returns expected output" {
        rfc7233 | Should -Be "YOUR_EXPECTED_VALUE"
    }
}
