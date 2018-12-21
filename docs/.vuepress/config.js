module.exports = {
    title: 'glwlg',
    description: 'glwlg的博客',
    head: [
        ['link', {rel: 'icon', href: '/favicon.ico'}], // 增加一个自定义的 favicon(网页标签的图标)
    ],
    base: '/',
    markdown: {
        lineNumbers: true // 代码块显示行号
    },
    themeConfig: {
        // sidebarDepth: 2, // e'b将同时提取markdown中h2 和 h3 标题，显示在侧边栏上。
        lastUpdated: 'Last Updated', // 文档更新时间：每个文件git最后提交的时间
        nav: [
            {text: 'GitHub', link: 'https://github.com/glwlg'}, // 内部链接 以docs为根目录
            // {text: '博客', link: 'http://obkoro1.com/'}, // 外部链接
            // // 下拉列表
            // {
            //     text: 'GitHub',
            //     items: [
            //         {text: 'GitHub地址', link: 'https://github.com/OBKoro1'},
            //         {
            //             text: '算法仓库',
            //             link: 'https://github.com/OBKoro1/Brush_algorithm'
            //         }
            //     ]
            // }
        ],
        // sidebar: [
        //     {
        //         title: '代理',
        //         collapsable: true,
        //         children: [
        //             '/proxy/nginx/'
        //         ]
        //     },
        //     // ['/proxy/','文章列表'],
        //     // ['/proxy/nginx/','nginx'],
        // ]
        sidebar: {
            '/nginx/': [
                {
                    title: 'nginx',
                    children: [
                        'nginx-rewrite',
                        '简单静态网站',
                    ]
                }
            ],
            '/proxy/': [
                {
                    title: '代理',
                    children: [
                        'nginx代理',
                        'sniproxy',
                    ]
                }
            ]
        }
    }
};
