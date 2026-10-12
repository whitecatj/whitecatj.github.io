# 冬风视觉更新

已确认：柔和紫蓝、Celeste 登顶背景、用户头像、冬风 / winterwind、签名 Infinity；去掉英文口号和简介等装饰文案。签名使用 _config.yml 的 subtitle，空字符串即隐藏。

执行顺序：
1. 保留 Landscape 的文章、数学与代码 DOM，复制主题到 themes/winterwind，定制 header、sidebar、footer，并追加独立 CSS。
2. 复制背景与头像到 source/images；修改主题、标题、作者、语言与签名配置。保留全部发布保护项与源文章。
3. TZ=Asia/Shanghai 下生成；与基线比较文章 URL、后台文件和公式资源；启动 Hexo server，浏览器检查桌面与手机。
4. 仅提交 main；推送后核对 Actions 和线上页面。域名保留现状，待用户指定自有域名。
