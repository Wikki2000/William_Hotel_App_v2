from apscheduler.schedulers.background import BackgroundScheduler
from .auto_logout import auto_logout_inactive_users
# from .stock_summary import create_daily_stock_summary (future)

def init_schedulers():
    scheduler = BackgroundScheduler()

    scheduler.add_job(auto_logout_inactive_users, 'interval', hours=12, id='logout_job')
    # scheduler.add_job(create_daily_stock_summary, 'cron', hour=0, id='stock_summary_job')

    scheduler.start()
    print("APScheduler started with background jobs.")
