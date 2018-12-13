'use strict';

const fs = require('fs');
const spawnSync  = require( 'child_process' );
const projects = {}

class defects4j{

	constructor(){
		projects['Chart'] = 26;
		projects['Closure'] = 133;
		projects['Lang'] = 65;
		projects['Math'] = 106;
		projects['Mockito'] = 38;
		projects['Time'] =27;
	}

	write(file_name, content){
		fs.writeFile('../output/defects4j/'+file_name, content, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The file was saved to "+'../output/defects4j/'+file_name);
		}); 
	}

	defects4j_get_specific_bug(bug_number, project){
		return spawnSync.spawnSync( 'defects4j', [ 'info', '-p', project, '-b', bug_number ] );
	}

	extract_bug(project){
		var summary = ''
		const startTag = '<start>\n'
		const endTag = '<end>\n'
		for (var i=1; i<=projects[project]; i++){
			const defects4j = this.defects4j_get_specific_bug(i, project) 
			summary = summary + startTag + defects4j.stdout.toString() + endTag
		}
		this.write(project+'.txt', summary)
	}

	extract_all(){
		for (var project in projects){
			this.extract_bug(project)
		}
	}
}

module.exports = defects4j
