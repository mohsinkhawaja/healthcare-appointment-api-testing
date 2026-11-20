# Execution evidence

`npm test` creates `fixture.junit.xml` and prints the scenario and assertion counts. The CI workflow uploads the JUnit report, including on assertion failures. The committed baseline describes the run that was actually performed. Fixture evidence cannot establish upstream behavior.
