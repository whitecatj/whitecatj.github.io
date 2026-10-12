---
title: "数列分段 Section II"
date: 2019-11-29 00:00:00
tags:
  - "题解"
---

## $Description$

对于给定的一个长度为N的正整数数列A，现要将其分成M(M≤N)段，并要求每段连续，且每段和的最大值最小。

<!-- more -->

## $Solution$

二分 & 贪心

二分的基本思想：通过伪暴力枚举+判断来寻找答案

关于本题：

“要求每段连续，且每段和的 _最大值最小_ ”

二分无疑

我们可以对要求的答案，即每段和的最大值进行二分。

第一件事：上下限

很明显，每段和的最大值最小也会大于等于数列中最大的数（真拗口，语文学渣哭唧唧）

而最大也不会超过所有数的和

所以上下限分别是

**l**: 数列中最大的数  
**r**: 数列中数字之和

第二件事：如何判断当前答案是大是小？

注意这段

“要求每段连续”

所以对于每一个尝试的 每段和的最大值

我们都可以从头进行模拟

看看分几段能使得每段的和都小于等于这个值

看看代码吧

```
bool check(int x){
    sum=t=0;
    for(int i=1;i<=n;i++){
        if(sum+a[i]<=x) sum+=a[i];
        else sum=a[i],t++;
    }
    return t>=m;//去掉=变20
}
```

其中sum是每一段的和，我们从头开始不停累加。

如果超过那个最大值就把这个数归到下一段，同时，我们用t这个计数器来计算一共有几段

最后return t>=m，是看看现在的段数多于要求的还是少于要求的，再根据这个进行二分。

还有些细节就看看注释吧

## $Code$

```
#include<bits/stdc++.h>
using namespace std;
int n,m,a[100001],l=-INT_MAX,r=0,sum,t;
bool check(int x){
    sum=t=0;
    for(int i=1;i<=n;i++){
        if(sum+a[i]<=x) sum+=a[i];
        else sum=a[i],t++;
    }
    return t>=m;
}//上面解释过了我可不可以不解释啊QWQ
int main(){ 
    cin>>n>>m;
    for(int i=1;i<=n;i++){
        cin>>a[i];
        r+=a[i];
        l=max(l,a[i]);
    } //r是所有数的和,l是所有数中的最大值
    
    //关键 ↓
    while(l<=r){  
        int mid=(l+r)/2;//通用模板不说了嗷
        if(check(mid)) l=mid+1;
        //如果check(mid)返回的是true，说明t>=m，即当前分段数多于或等于需要的分段数，这说明我们给的最大值小了，于是把l右移
        else r=mid-1;
        //同上
    }
    cout<<l;// l即是我们要的答案
    return 0;
}//233
```

题目补充 [P1316 丢瓶盖](https://www.luogu.org/problem/P1316)
