function callPromiseInChain (list: Array<() => Promise<any>>) {
    return new Promise((resolve, reject) => {
      let step = list[0]()

      for (let i = 1; i < list.length; i++) {
        step = step.then(list[i])
      }

      step.then(resolve, reject)
    })
  }
