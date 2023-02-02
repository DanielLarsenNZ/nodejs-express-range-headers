BeforeAll {
    . $PSCommandPath.Replace('.Tests.ps1', '.ps1')
}

Describe "rfc7233" {
    It "Returns expected output" {
        rfc7233 | Should -Be "YOUR_EXPECTED_VALUE"
    }
}
