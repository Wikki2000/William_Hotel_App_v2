from models.hotel_setting import HotelSetting
from models import storage


h = HotelSetting()
storage.new(h)
storage.save()

