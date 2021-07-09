# This project will not be updated further for a while

# VSCode FTP Extension

This is FTP Extension!

Start with `ftp-kr Init` command! (When exists workspace)

![init](https://github.com/deeyi/ftp-kr/raw/master/images/init.png)

![init after](https://github.com/deeyi/ftp-kr/raw/master/images/init-after.png)  
It will try to connect when you save it!  

![download all](https://github.com/deeyi/ftp-kr/raw/master/images/downloadall.png)

## Details

* Disable Auto Upload  
By default, the auto-sync feature is enabled  
If you want to disable auto-sync, please set autoUpload/autoDelete to false  
![auto](https://github.com/deeyi/ftp-kr/raw/master/images/autofeature.png)

* Use Password Input  
You can use password input instead of password field  
![password input](https://github.com/deeyi/ftp-kr/raw/master/images/password.png)

* Browse FTP Server  
You can browse remote directory with `ftp-kr List` command!  
![list](https://github.com/deeyi/ftp-kr/raw/master/images/list.png)

* You can find extra options in ftp-kr.json with auto complete(`Ctrl+Space`)!  
[See schema of ftp-kr.json](https://github.com/deeyi/ftp-kr/blob/master/./schema/ftp-kr.md)  
![autocom](https://github.com/deeyi/ftp-kr/raw/master/images/autocomplete.png)

* Use Multiple Servers  
![multiserver](https://github.com/deeyi/ftp-kr/raw/master/images/multiserver.png)  
if you write altServer field, It will show server selection in some commands.

* Use Private Key  
You can use SFTP with private key!  
![privatekey](https://github.com/deeyi/ftp-kr/raw/master/images/privatekey.png)

* Use more ftp/sftp options  
You can override ftp/sftp options by `ftpOverride`/`sftpOverride` field, It will pass to connect function of `ftp`/`ssh2` package.

## Available functions & commands
* Real-Time FTP/SFTP synchronization(You can off it!)
* `ftp-kr: Init` - Starts up extension and generates `ftp-kr.json`.
* `ftp-kr: Upload All` - Upload all without same size files
* `ftp-kr: Download All` - Download all without same size files
* `ftp-kr: Upload This` - Upload this file.
* `ftp-kr: Download This` - Download this file.
* `ftp-kr: Delete This` - Delete file in remote server.

## Advanced commands
* `ftp-kr: Diff This` - Diff this file.
* `ftp-kr: Refresh` - Rescan remote files.
* `ftp-kr: Clean All` - Cleaning remote files that not in workspace.
* `ftp-kr: Run task.json` - Run a batch task. It is auto generated and run by `* All` commands. You can use it with same syntax
* `ftp-kr: Reconnect` - Reconnect the server.
* `ftp-kr: Cancel` - Cancel current tasks
* `ftp-kr: Target` - Swaps the main server. For using with alternate servers
* `ftp-kr: List` - Browse remote directories. 
* `ftp-kr: View` - View a remote file. used internally


## And...

Bug Report & Feature Request: https://github.com/deeyi/ftp-kr/issues  
Wiki: https://github.com/deeyi/ftp-kr/wiki  
I'm not good at english, Sorry for my bad english ㅠㅠ  

**Enjoy!**
