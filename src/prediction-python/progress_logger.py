
class ProgressLogger:
    log_factor = 100
    def __init__(self, total=None):
        self.i = 0
        if not isinstance(total, int):
            raise Exception("total must be int")
        self.total = total
    def iteration(self):
        self.i += 1
        if (self.i % int(self.total / 100)) == 0:
            self.log()
    def stop(self):
        print()
    def reset(self):
        print()
        self.i = 0
    def log(self):
        percent = int(100 * self.i / self.total)
        print("{}/{}  {}% complete\r".format(self.i, self.total, percent), end="", flush=True)
        

