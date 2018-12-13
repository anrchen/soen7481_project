const fs = require('fs')

const defects4j = require('./defects4j')
const git = require('./github')
const extract = require('./extractor')
const jacoco = require('./jacoco')

// Extract bugs from defects4j database
// const defects4j_local = new defects4j
// defects4j_local.extract_all()

// Get Bug Report ID from github
// const git_repo = new git
// const bug_summary_list = git_repo.extract_br_id()
// --> The output is printed in console / replace ' by " in array

// Extract issues with exceptions
// const extractor = new extract
// const file_list = extractor.exact_issues_w_except()

// List of files containing exceptions & tests
// const issues_w_exp_n_test = extractor.exact_issues_w_exp_n_test(file_list)
// console.log(issues_w_exp_n_test)

// Extract Jacoco execution path
// tests = issues_w_exp_n_test['LANG-567']

const jacoco_module = new jacoco
// jacoco_module.execute_all(tests)

// Easy test purpose
tests = [ 'org.apache.commons.lang3.SystemUtilsTest' ]
jacoco_module.retrieve_test_exec_path(tests[0])


// <- into dataframe.import_data()
// const dtframe = require('./dataframe')
// const data_frame = new dtframe
// const path = '/Users/mac/Documents/GitHub/SOEN7481/commons-lang/'+'target/jacoco-ut/'
// const package = 'org.apache.commons.lang3.math'
// const file_class = 'NumberUtils'
// data_frame.retrieve_method_list(path, package, file_class)