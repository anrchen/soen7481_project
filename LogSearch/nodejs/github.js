const fs = require('fs')
const request = require('request');
const defects4j_dir = '../output/defects4j/'
const projects = [
	'Chart',
	'Closure',
	'Lang',
	'Math',
	'Mockito',
	'Time',
]

class github {
	constructor(){
	}

	read(file){
		return fs.readFileSync(defects4j_dir+file, 'utf8')
	}

	to_bug_summary(match){
		var bug_summary = {}
		var tests = []

		// Commit ID
		var re = /\b[0-9a-f]{40}\b/g
		const commit_id = re.exec(match)[0]
		
		// Root cause
		re = /Root cause in triggering tests:[\s\S]*?(?=-----)/
		const root_cause = re.exec(match)
		if (root_cause){
			re = / - (([a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]).([a-zA-Z_]*))/g
			// Affected tests
			var af_tests = re.exec(root_cause)
			while (af_tests != null){
				// package is the second captured group
				tests.push(af_tests[1])
				af_tests = re.exec(root_cause)
			}
		}

		bug_summary['commit_id'] = commit_id
		bug_summary['tests'] = tests
		return bug_summary
	}

	auth(){
		var username = "anrchen"
	    var password = "abc107953"
	    var auth = "Basic " + new Buffer(username + ":" + password).toString("base64")
	    return auth
	}

	http_get_bug(commit_id, tests){
		// Request headers
		var headers = {
		    'User-Agent':       'Super Agent/0.0.1',
		    'Content-Type':     'application/x-www-form-urlencoded',
		    "Authorization" : 	this.auth()
		}

		// Request body
		var options = {
		    url: 'https://api.github.com/repos/apache/commons-lang/git/commits/'+commit_id,
		    method: 'GET',
		    headers: headers
		}

		request(options, function (error, response, body) {
		    if (!error && response.statusCode == 200) {
		       var body_array = JSON.parse("[" + body + "]")
		       var message = body_array[0].message
		       var re = /(LANG-\d+)/
		       var m = re.exec(message)
		       var bug_id = m[0]
		       console.log(bug_id, tests)
		    }
		})
	}

	extract_br_id(){
		var bug_summary_list = this.extract_bug_summary_list()
		for (var bug in bug_summary_list){
			var tests = this.remove_duplicate(bug_summary_list[bug].tests)
			this.http_get_bug(bug_summary_list[bug].commit_id, tests)
		}
	}

	extract_bug_summary_list(){
		var file = ''
		var bug_summary_list = []
		// for (var project in projects){
		// 	file = project+'.txt'
		// 	// read(file)
		// }
		var content = this.read('Lang.txt')
		var re = /<start>([\S\s]*?)<end>/g
		var m = re.exec(content)
		while (m != null){
			var bug_summary = this.to_bug_summary(m[0])
			bug_summary_list.push(bug_summary)
			m = re.exec(content)
		}
		return bug_summary_list
	}

	remove_duplicate(array){
		let unique_array = []
	    for(let i = 0;i < array.length; i++){
	        if(unique_array.indexOf(array[i]) == -1){
	            unique_array.push(array[i])
	        }
	    }
	    return unique_array
	}
}

module.exports = github