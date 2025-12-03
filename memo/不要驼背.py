import time, random, os
while True:
    os.system('osascript -e \'display dialog "不要驼背！不要驼背！！不要驼背！！！不要跑神！" with title "notice" buttons {"OK"} default button 1\'')
    delay = random.randint(60 * 5, 60 * 10)  # 5 ~10 分钟（单位：秒）
    print(f"下次提醒将在 {delay/60:.1f} 分钟后")
    time.sleep(delay)