# GitPython module
import os
import errno
import re
import git
import sys
import json
import ntpath
from datetime import datetime

# Load all changes attached to 'commit'
def get_changes(commit):
    # Show diff with 0 line of context
    result = g.git.execute(["git", "show", commit, "--unified=0"])
    changes = result.split('diff --git')
    changes.pop(0)
    # Process the changes
    fixes = {}
    for change in changes:
        fix = {}
        modifications = re.findall('@@ (.*?) @@', change)
        line_id = 0
        fix_string = re.findall('(?:\@\@(.*)\n(\-|\+)\s*)(.*)(?:\n)', change)
        # modification format 
        # 0. line change 
        # 1. -/+ 
        # 2. fixed line
        for modification in modifications:
            lineChange = modification.split(' ')
            lineFix = {}
            lineFix['lineNumber'] = re.sub('\-', '', lineChange[0]).split(',')[0]
            lineFix['newLineNumber'] = re.sub('\+', '', lineChange[1])
            try:
                lineFix['numberOfLineModified'] = re.sub('\-', '', lineChange[0]).split(',')[1]
            except IndexError:
                lineFix['numberOfLineModified'] = 0
            linefix_string = [item[2] for item in fix_string if lineChange[0] in item[0]]
            if not linefix_string:
                linefix_string = [item[2] for item in fix_string if lineChange[0] in item[1]]
            lineFix['fix_string'] = linefix_string
            try:
                lineFix['method_signature'] = fix_string[0][0].split('@@ ')[1]
            except IndexError:
                lineFix['method_signature'] = 'null'
            lineFix['fix_string'] = re.sub('^(\-|\+)(\s+)', '',lineFix['fix_string'][0])
            fix[line_id] = lineFix
            line_id+=1
        pat = r'\-\-\- [\w](\/[A-Za-z_\-\s0-9\.]+)+\.([A-Za-z]{2,})'
        try:
            fileName = re.search(pat, change).group(0).split('--- a/')[1]
        # when an AttributeError is thrown, it means it is a new file        
        except AttributeError:
            print('Last modification created the file')
            continue
        fixes[fileName] = fix
    return fixes
    
# Given individual file name and line number, return the last commits that changed it
def get_last_commit(fileName, lineNumber, toLineNumber):
    # Retrieve data from git repo
    changeLocation = str(lineNumber)+","+str(toLineNumber)+":"+fileName
    result = g.git.execute(["git", "log", "--pretty=short", "-u", "-L", changeLocation])
    groups = result.split('\n\n')
    changes = {'\n\n'.join(x) for x in zip(groups[0::3], groups[1::3], groups[2::3])}

    # Populate logs list
    id = 0
    logs = {}
    for index, change in enumerate(changes):
    #    print(change)
        changelog = {}
        changelog['commit']=re.search('[0-9a-f]{5,40}', change).group(0)
        title = re.search(project+'-[0-9]{1,5}: (.*?)\n', change)
        changelog['id']=title.group(0).split(': ')[0] if title != None else ""
        changelog['issue']=title.group(0).split(': ')[1] if title != None else title
        line=re.search('@@ (.*?) @@', change).group(0).split(' ')
        changelog['remove']=line[1]
        changelog['add']=line[2]
        logs[id] = changelog
        id+=1
    return logs;

def buggy_commit(bugFixedCommit, filePath, lineNumber, toLineNumber, fix_string):
    changeLocation = str(lineNumber)+","+str(toLineNumber)+":"+filePath
    result = g.git.execute(["git", "log", "--pretty=short", "-u", "-L", changeLocation])
    commits=re.findall('[0-9a-f]{5,40}', result)
    try:
        originalIndex = commits.index(bugFixedCommit)
        commits = commits[originalIndex+1:]
    except ValueError as ve:
        print("\tgit log -S '"+fix_string+"' "+filePath)
        # Upon line number change/line removal, use 'git log -S [string] [file]' to find the commits
        result = g.git.execute(["git", "log", "-S", fix_string, filePath])
        commits=re.findall('[0-9a-f]{40}', result)
        print(commits)
#        if any(bugFixedCommit in item for item in commits):
#            originalIndex = commits.index(bugFixedCommit)
#            commits = commits[originalIndex+1:]
#        else:
#            commits = ""
    stats = {}
    for commit in commits:
        stats[commit] = get_statics_btwn_commit(bugFixedCommit, commit)
        stats[commit]['fileContent'] = store_file_content(commit, filePath)
    return stats

def get_statics_btwn_commit(bugFixedCommit, commit):
    stats = {}
    stats['commitsBtwn'] = g.git.execute(["git", "rev-list", commit+".."+bugFixedCommit, "--count"])
    timeCommit = g.git.execute(["git","log", commit, "-n 1", "--format=%ad"])
    timeOrig = g.git.execute(["git","log", bugFixedCommit, "-n 1", "--format=%ad"])
    datetime_format = "%a %b %d %H:%M:%S %Y %z"
    datetime_timeCommit = datetime.strptime(timeCommit, datetime_format)
    datetime_timeOrig = datetime.strptime(timeOrig, datetime_format)
    timeElapsed = datetime_timeOrig - datetime_timeCommit
    stats['timeElasped'] = timeElapsed.days
    return stats

def store_file_content(commit, filePath):
    content = g.git.execute(["git", "show", commit+":"+filePath])
    file = "output/"+issue+"/"+path_leaf(filePath)+"@"+commit
    # create dir 'output' if not exist
    if not os.path.exists(os.path.dirname(file)):
        try:
            os.makedirs(os.path.dirname(file))
        except OSError as exc: # Guard against race condition
            if exc.errno != errno.EEXIST:
                raise
    write_to_file(file, content)
    return file
    
def write_to_file(file, content):
    text_file = open(file, "w")
    text_file.write(content)
    text_file.close()

def path_leaf(path):
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)

def get_related_commits(bug_fixed_commit,buggy_commit, filePath, method_signature):
    # list commits btwn bug_fixed_commit and buggy_commit
    result = g.git.execute(["git", "log", "--", filePath])
    commits = re.findall('[0-9a-f]{40}', result)
    commits = commits[(commits.reverse(), len(commits) - commits.index(bug_fixed_commit), commits.reverse())[1] : commits.index(buggy_commit)]
    
    print(bug_fixed_commit)
    commits = filter_by_method_signature(commits, method_signature, filePath)
    return commits

def filter_by_method_signature(commits, method_signature, filePath):
    filtered_commits = []
    for a_commit in commits:
        result = g.git.execute(["git", "show", a_commit, "--", filePath])
        a_change = re.findall('(?:(\@\@(.*)\@\@ )(.*))', result)
        if a_change:
            the_method_signature = a_change[0][2]
#            print(method_signature)
            print(a_commit)
            print(the_method_signature)
            if method_signature in the_method_signature:
                filtered_commits.append(a_commit)
    return filtered_commits

def toJson(fixes):
    with open('changelog.json', 'w') as fp:
#        filterData(fixes)
        json.dump(fixes, fp)
        
def filterData(fixes):
    for fix in fixes:
        for file in fixes[fix]:
            for change in fixes[fix][file]:
#                del fixes[fix][file][change]['fix_string']
                del fixes[fix][file][change]['lineNumber']
                del fixes[fix][file][change]['newLineNumber']
                del fixes[fix][file][change]['numberOfLineModified']

def list_commits_since(bugFixedcommit):
    commits = g.git.execute(["git", "rev-list", bugFixedcommit]).split('\n')
#    print(commits)
    
def related_commits(changes):
    for file in changes:
        for change in changes[file]:
            lineNumber = changes[file][change]['lineNumber']
            fix_string = changes[file][change]['fix_string']
            method_signature = changes[file][change]['method_signature']
            toLineNumber = int(changes[file][change]['lineNumber'])+int(changes[file][change]['numberOfLineModified'])
            try:
                a_buggy_commit = buggy_commit(commit, file, lineNumber, toLineNumber, fix_string)
                print(a_buggy_commit)
                if not a_buggy_commit:
                    changes[file][change]['tag'] = 'no_previous_change'
                else:
                    changes[file][change]['buggy_commit'] = a_buggy_commit
                changes[file][change]['related_commit'] =  get_related_commits(commit, list(a_buggy_commit.keys())[0], file, method_signature)
            except git.GitCommandError as e:
                if e.stderr.find('no path')>0:
                    print(e.stderr)
                    changes[file][change]['tag'] = 'file_deleted'
    #               commits = get_last_commit_full_history(fileName)
    #               print(str(len(commits)))
               # TODO handle deleted files

    return changes

def pretty_print():
    print('commit: ')
    print('affected methods: ')
    print('commits that last modified method: ')

# Constants
project = "zookeeper".upper()
repo = "/Users/mac/Documents/GitHub/LogSearch/sample_project/"
#issue = "ZOOKEEPER-3146"
#issue = "ZOOKEEPER-1864"
issue = "ZOOKEEPER-2836"
#issue = "ZOOKEEPER-1560"
g = git.Repo(repo+project)

# Retrieve all commits related to 'issue'
result = g.git.execute(["git", "log", "--all", "--grep="+issue])
commits = list(set(re.findall('[0-9a-f]{40}', result)))

if not commits:
    print('No related commits')
    sys.exit()

for commit in commits:
    print('Fix occurs in commit '+commit)
    
    changelog = {}
    changes = get_changes(commit)
    changelog[commit] = changes

    changes = related_commits(changes)
    toJson(changelog)
    

