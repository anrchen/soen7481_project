const fs = require('fs')

const lang_issues_dir = './resource/LANG/'

class extractor {
	constructor(){}

	find(lang_issues_dir, keyword){
		var file_list = []
		if (!fs.existsSync(lang_issues_dir)){
			console.log(`Directory ${lang_issues_dir} does not exit`)
			return
		}

		const files = fs.readdirSync(lang_issues_dir);
		files.forEach(file => {
			if(file.indexOf('.json') == -1) {
				return
			}
			const content = fs.readFileSync(lang_issues_dir+file)
			const re = new RegExp('\\b' + keyword + '\\b');
	        if (re.test(content)) {
	            file_list.push(file)
	        }
		})
		return file_list
	}

	exact_issues_w_except(){
		var file_list = this.find(lang_issues_dir, '([A-Z][a-z0-9]+)+([E|e]xception)')
		return file_list
	}

	exact_issues_w_exp_n_test(file_list){
		var issues_w_exp_n_test = {}
		var total_w_excp = 0
		var total_w_excp_test = 0
		file_list.forEach(file => {
			const defects4j_lang = fs.readFileSync('./output/Lang_BR.txt', 'utf8')
			const file_name = file.replace('.json','')
			if (defects4j_lang.indexOf(file_name+' ') > -1){
				var re_tests =  new RegExp(file_name + ' (.*)', 'g')
				var tests_m = re_tests.exec(defects4j_lang)

				total_w_excp ++
				const content = fs.readFileSync('./resource/LANG/'+file)
				const re_except = /(([A-Z][a-z0-9]+)+([E|e]xception))/g
				const re = /at ([a-z][a-z0-9_]*?(\.[a-z0-9_]+?)+[0-9a-z_])\.{1}([A-Za-z]*?)\.([A-Za-z]*)\((.*?)(\d+)\)/g
				// const re = /(([A-Z][a-z0-9]+)+([E|e]xception))[\s\S]*?(([a-z][a-z0-9_]*\.([a-z0-9_]+)+[0-9a-z_])([a-zA-Z_]*?))\((.*?.java):(\d+)/g
				const result_except = re_except.exec(content)
				var result = re.exec(content)
				if (result!=null & result_except!=null){
					total_w_excp_test ++

					if (tests_m != null){
						var tests_array = tests_m[1]
						tests_array = JSON.parse(tests_array)
						issues_w_exp_n_test[file_name] = tests_array
					}
				}
				while (result != null){
					const exception = result_except[0]
					const package_name = result[1]
					const af_file = result[3]+'.java'
					const method = result[4]
					const line_numb = result[6]
					result = re.exec(content)
					// Info 
					// console.log('\t'+exception+' in '+af_file+' at '+method+' line '+line_numb)
				}
			}

		})

		// Info
		// console.log('Total of '+file_list.length+' issues')
		// console.log('\t'+total_w_excp+' issues with exceptions')
		// console.log('\t'+total_w_excp_test+' issues with exceptions & tests')
		return issues_w_exp_n_test
	}
	
}

module.exports = extractor