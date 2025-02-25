from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import socket
import os

PORT = 3000

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """重写日志方法，打印更详细的信息"""
        sys.stderr.write("[%s] %s - - %s\n" %
                        (self.log_date_time_string(),
                         self.address_string(),
                         format%args))

def get_ip():
    """获取本机IP地址"""
    try:
        # 创建一个UDP套接字
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接一个外部地址（不需要真实连接）
        s.connect(('8.8.8.8', 80))
        # 获取本机IP
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '0.0.0.0'

def run(port=PORT):
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f'启动本地服务器在 http://localhost:{port}/')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        sys.exit(0)

if __name__ == '__main__':
    # 获取本机IP
    ip = get_ip()
    
    try:
        # 确保当前目录是项目根目录
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # 启动服务器
        run()
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"错误：端口 {PORT} 已被占用")
            print("请先关闭占用该端口的程序，或者修改 PORT 变量使用其他端口")
        else:
            print(f"启动服务器时发生错误: {e}")
    except KeyboardInterrupt:
        print("\n服务器已停止")
        sys.exit(0)
    except Exception as e:
        print(f"发生未知错误: {e}")
        sys.exit(1) 