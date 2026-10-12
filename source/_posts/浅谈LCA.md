---
title: "浅谈LCA"
date: 2019-12-04 00:00:00
tags:
  - "题解"
---

## $Description$

LCA（Least Common Ancestors），即一颗树中，两个结点的最近公共祖先

<!-- more -->

## $Solution$

题意太明了了，不解释了

首先暴力肯定是简单好写，从两个点出发，一个一个往上爬，如果相遇了就代表是他们的最近公共祖先，不解释了

***倍增***

倍增人如其名，就是按2的倍数去跳，就是跳1，2，4，8，16……

很显然，靠这些数字我们可以快速地表示出每一个数

（如果用二进制可能会很好理解，随便举一个10011=10000+10+1）

这样找到每一个数的时间就会下降到$logn$,快了很多

代码实现：

首先介绍一个东西：

```
lg[0] = -1;
for(int i = 1; i <= n; ++i) lg2[i] = lg2[i>>1] + 1;
```

可以快速地预处理出log_2(i)的值，背上吧

接下来，是核心

```
void dfs(int now, int fa){
	//now：当前节点，fa：当前节点父节点
	f[now][0] = fa;
	//f[i][j]:i节点的2^j祖先
	dep[now] = dep[fa] + 1;
	//dep[i]:i节点的深度
	for(int i = 1; i <= lg2[dep[now]]; ++i) f[now][i] = f[f[now][i-1]][i-1];
	//now的2^i祖先可以表示为now的2^(i-1)祖先的2^(i-1)祖先
	//2^i = 2^(i - 1) + 2^(i - 1)
	for(int i = head[now]; i; i = e[i].nxt){
		int y = e[i].to;
		if(y != fa) dfs(y, now);
		//遍历当前节点的子节点
	}
}
```

接下来是查询

```
int LCA(int x, int y){
	if(dep[x] < dep[y]) swap(x, y);
	while(dep[x] > dep[y]) x = f[x][lg2[dep[x]-dep[y]]];
	//通过倍增，把x和y的深度调成相同的
	if(x == y) return x;
	for(int i = lg2[dep[x]]; i >= 0; --i){
		if(f[x][i] != f[y][i]){
			x = f[x][i];
			y = f[y][i];
		}
	}
	//不断往上跳
	return f[x][0];
	//返回他们的父子节点（因为我们跳到的是相遇节点的下一层）
}
```

之后就直接上代码吧

## $Code$

```
#include<bits/stdc++.h>
#define N 1000005
using namespace std;

int n, m, s, cnt;
int head[N], f[N][25], dep[N], lg2[N];

struct Edge{
	int to,nxt; 
}e[N];

void ycl(){
    lg2[0] = -1;
    for(int i = 1; i <= n; ++i) lg2[i] = lg2[i>>1] + 1;
}

void add(int u, int v){
	e[++cnt].to = v;
	e[cnt].nxt = head[u];
	head[u] = cnt;
}

void dfs(int now, int fa){
	f[now][0] = fa;
	dep[now] = dep[fa] + 1;
	for(int i = 1; i <= lg2[dep[now]]; ++i) f[now][i] = f[f[now][i-1]][i-1];
	for(int i = head[now]; i; i = e[i].nxt){
		int y = e[i].to;
		if(y != fa) dfs(y, now);
	}
}

int LCA(int x, int y){
	if(dep[x] < dep[y]) swap(x, y);
	while(dep[x] > dep[y]) x = f[x][lg2[dep[x]-dep[y]]];
	if(x == y) return x;
	for(int i = lg2[dep[x]]; i >= 0; --i){
		if(f[x][i] != f[y][i]){
			x = f[x][i];
			y = f[y][i];
		}
	}
	return f[x][0];
}

int main(){
	scanf("%d%d%d", &n, &m, &s);
	for(int i = 1; i < n; ++i){
		int u, v;
		scanf("%d%d", &u, &v);
		add(u, v); 
		add(v, u);
	}
	ycl();
	dfs(s, 0);
	for(int i = 1; i <= m; ++i){
		int x, y;
		scanf("%d%d", &x, &y);
		printf("%d\n", LCA(x, y));
	}
	return 0;
}
```
