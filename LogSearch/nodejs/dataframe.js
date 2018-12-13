const fs = require('fs')
var DataFrame = require('dataframe-js').DataFrame;

class dataframe{

	import_data(path_to_file, csv_file, test){
		DataFrame.fromCSV(path_to_file+csv_file).then(df => {
			df = df.select('PACKAGE', 'CLASS', 'METHOD_COVERED', 'INSTRUCTION_MISSED', 'INSTRUCTION_COVERED');
			df = df.filter(row => row.get('METHOD_COVERED') > 0);
			df.show()
			// connect retrieve_method_list here with path_to_file
			var df_array = df.toArray();
			for (var row in df_array){
				const package_name = df_array[row][0]
				const class_name = df_array[row][1]
				this.retrieve_method_list(path_to_file, package_name, class_name)
			}
		});
	}

	retrieve_method_list(path_to_file, package_name, class_name){
		const extension = '.html'
		const file = path_to_file+package_name+'/'+class_name+extension
		fs.readFile(file, 'utf-8', function(err, html_out) {
			if (err){
				console.log('An error occurs in retrieve_method_list:'+err)
			}

			const re = /<tr>(.|\n)*?<\/tr>/g
			const re_method = /<a(.*?)(#L(\d*))(.*?)>((.|\n)*?)<\/a>/
			// re_method: find method between a href tag 
			// Full match	`<a href="NumberUtils.java.html#L1599" class="el_method">isCreatable(String)</a>`
			// Group 1.		` href="NumberUtils.java.html`
			// Group 2.		`#L1599`
			// Group 3.		`1599`
			// Group 4.		`" class="el_method"`
			// Group 5.		`isCreatable(String)`
			// Group 6.		`)`
			const re_instruc_coverage = /(id=\"c\d*\")>(\d*)/
			// Full match	`id="c63">99`
			// Group 1.	`id="c63"`
			// Group 2.	`99`
			const re_branch_coverage = /(id=\"e\d*\")>(\d*)/
			const re_missed_complxty = /(id=\"d\d*\")>(\d*)/
			const re_complxty = /(id=\"g\d*\")>(\d*)/
			const re_missed_line = /(id=\"h\d*\")>(\d*)/
			const re_line= /(id=\"i\d*\")>(\d*)/
			const re_missed_method_count = /(id=\"j\d*\")>(\d*)/
			const re_method_count = /(id=\"k\d*\")>(\d*)/
			var m = re.exec(html_out)
			console.log(class_name)
			while(m){
				if(m[0].includes('el_method')){
					const method_m = re_method.exec(m[0])
					var method = method_m[5]
					var line_number = method_m[3]

					const instruc_coverage_m = re_instruc_coverage.exec(m[0])
					var percent_instruc_coverage = instruc_coverage_m[2]

					if (percent_instruc_coverage > 0){
						console.log('\t' + method + ' at line ' + line_number)
						console.log('\t\t at '+percent_instruc_coverage+'% instruction coverage\n')
					}
				}
				m = re.exec(html_out)
			}
		})
	}
}

module.exports = dataframe