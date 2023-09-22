#!/bin/sh
export PATH=$PATH:/usr/local/bin
APPNAME=szvsud-platform-visualization-front
rm -rf ./${APPNAME} ./${APPNAME}.tar.gz ./output_scm
mkdir ${APPNAME}
# 项目编译
npm i
npm run build
# cp -rf dist/index.html ../../${APPNAME}
mv -f ./dist ./${APPNAME}/${APPNAME}
# 产出资源压缩
mkdir output_scm
cd ./${APPNAME}/
tar zcvf ./${APPNAME}.tar.gz --exclude=build.sh --exclude=README.md *
mv ${APPNAME}.tar.gz ../output_scm
cd ../
# generate the md5
md5sum ./output_scm/${APPNAME}.tar.gz > ./output_scm/${APPNAME}.tar.gz.md5
# for mac-ox local
# md5 ./output_scm/${APPNAME}.tar.gz > ./output_scm/${APPNAME}.tar.gz.md5
exit 0
