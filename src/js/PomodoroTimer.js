
class PomodoroTimer{
    constructor(taskRepository, settings){
        this.currentTask = null;
        this.interval = null;
        this.timerStarted = false;
        this.paused = false;
        this.delay = 1000;
        this.time = null;
        this.taskRepository = taskRepository;
        this.settings = settings;
    }

    initializeTimer(currentTask){
        this.currentTask = currentTask;
        this.time = (this.settings.timeBlockSize * this.currentTask.timeBlocks) * 60;
        this.timerStarted = true; 
        this.interval = setInterval(this.updateTime.bind(this), this.delay);
    }

    start(callback){
        this.taskRepository.fetchNextIncomplete(function(error, result){
            this.initializeTimer(result.task);
            callback(this.time, result.task);
        }.bind(this));
    }

    updateTime(){
        if (this.time > 0){
            this.time--;
            chrome.runtime.sendMessage({command: "updateTime", 
            time: this.time, task: this.currentTask});
        } else {  
            clearInterval(this.interval);
            this.currentTask.setComplete(this.settings.timeBlockSize);
            this.taskRepository.save(this.currentTask, function(error, result){});
            this.taskRepository.fetchNextIncomplete(function(error, result){
                if (this.settings.displayTaskNotification)
                    this.notify(this.currentTask, result.task)
                chrome.runtime.sendMessage({command: "taskComplete", task: this.currentTask});
                if (result.task){
                    this.initializeTimer(result.task);
                    chrome.runtime.sendMessage({command: "updateTime", 
                    time: this.time, task: this.currentTask});
                } else {
                    this.resetTimer();
                    chrome.runtime.sendMessage({command: "allTasksComplete"})
                }
            }.bind(this)); 
        }  
    }

    notify(currentTask, nextTask){
        let nextTaskOutput = "There are no more tasks today"
        if (nextTask)
            nextTaskOutput = "The next task is " + nextTask.title;
        alert(currentTask.title + " is complete.\n" + nextTaskOutput );
    }

    resetTimer(){
        this.currentTask = null;
        this.time = null;
        this.timerStarted = false;
        clearInterval(this.interval);     
    }

    stop(callback){
        this.resetTimer();
        callback();
    }

    pause(callback){
        if (this.paused){
            this.interval = setInterval(this.updateTime.bind(this), this.delay);    
            this.paused = false;
        } else {
            clearInterval(this.interval)
            this.paused = true;
        } 
        callback();
    }

    loadTimer(callback){
        if (this.currentTask && this.timerStarted){
            chrome.runtime.sendMessage({command: "updateTime", time: this.time});  
            callback({timerStarted: this.timerStarted, currentTask: this.currentTask}); 
        }
    }
}