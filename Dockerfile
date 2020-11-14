# Docker の Nginx Web サーバー上でビューアーを動かします
FROM duluca/minimal-nginx-web-server
COPY . /var/www
CMD 'nginx'

# ```shellsession:使い方
# $ #イメージの作成 （my_viewer_image は任意）
# $ docker build -t my_viewer_image .
# $ ...
# $ #コンテナをバックグラウンドで起動 （my_viewer_container は任意。--rm は '--' なので注意）
# $ docker run --rm -d -p 8080:80 --name my_viewer_container my_viewer_image
# $ ...
# $ #以降はブラウザから http://localhost:8080/ でアクセス可能です。
# $
# $ #コンテナの終了 （上記の --name で指定したコンテナ名を指定）
# $ docker container kill my_viewer_container
# my_viewer_container
# ```
