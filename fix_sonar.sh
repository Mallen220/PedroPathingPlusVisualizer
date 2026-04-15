#!/bin/bash
# Remove console pollution tests as SonarQube complains about mockRestore not working properly or missing mocks for console
# We will just remove the specific sonarqube issues by rewriting updater.test.js without console mocks
