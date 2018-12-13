const child_process  = require( 'child_process' )

const dtframe = require('./dataframe')
const path_to_commons_lang = '/Users/mac/Documents/GitHub/SOEN7481/commons-lang/'

class jacoco{

	exec_in_dir(command, dir, test, success_callback, fail_callback){
		child_process.exec( command, {
				cwd: dir
			}, function(error, stdout, stderr){
				if (error){
					fail_callback(command+' execution', stderr)
				}

				if (stdout.includes('[INFO] BUILD SUCCESS')){
					success_callback(test)
				}
		})
	}

	retrieve_test_exec_path(test){
		console.log(test+' build success')
		const jacoco_ut_path = path_to_commons_lang+'target/jacoco-ut/'
		const jacoco_file = 'jacoco.csv'
		const data_frame = new dtframe
		data_frame.import_data(jacoco_ut_path, jacoco_file, test)
	}



	fail_callback(command, stderr){
		console.log('An problem has been encountered during '+command+'...')
		console.log('<¯¯¯¯¯¯¯¯¯\\_(๑❛ᴗ❛๑)_/¯¯¯¯¯¯¯¯¯¯> maybe the test suite no longer exists')
	}

	execute(test){
		const command = 'mvn clean test -Dtest='+test
		this.exec_in_dir(command, path_to_commons_lang, test, this.retrieve_test_exec_path, this.fail_callback)
	}

	execute_all(tests){
		for (var test in tests){
			const execution_trace = this.execute(tests[test])
		}
	}
}

module.exports = jacoco