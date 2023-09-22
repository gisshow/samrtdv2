import dva from 'dva';
import { Component } from 'react';
import createLoading from 'dva-loading';
import history from '@tmp/history';

let app = null;

export function _onCreate() {
  const plugins = require('umi/_runtimePlugin');
  const runtimeDva = plugins.mergeConfig('dva');
  app = dva({
    history,
    
    ...(runtimeDva.config || {}),
    ...(window.g_useSSR ? { initialState: window.g_initialData } : {}),
  });
  
  app.use(createLoading());
  (runtimeDva.plugins || []).forEach(plugin => {
    app.use(plugin);
  });
  
  app.model({ namespace: 'basemap', ...(require('F:/gws-visualization-front-320/src/models/basemap.js').default) });
app.model({ namespace: 'commute', ...(require('F:/gws-visualization-front-320/src/models/commute.js').default) });
app.model({ namespace: 'fishing', ...(require('F:/gws-visualization-front-320/src/models/fishing.js').default) });
app.model({ namespace: 'global', ...(require('F:/gws-visualization-front-320/src/models/global.js').default) });
app.model({ namespace: 'home', ...(require('F:/gws-visualization-front-320/src/models/home.js').default) });
app.model({ namespace: 'house', ...(require('F:/gws-visualization-front-320/src/models/house.js').default) });
app.model({ namespace: 'layersManager', ...(require('F:/gws-visualization-front-320/src/models/layersManager.js').default) });
app.model({ namespace: 'map', ...(require('F:/gws-visualization-front-320/src/models/map.js').default) });
app.model({ namespace: 'rightFloatMenu', ...(require('F:/gws-visualization-front-320/src/models/rightFloatMenu.js').default) });
app.model({ namespace: 'timeline', ...(require('F:/gws-visualization-front-320/src/models/timeline.js').default) });
app.model({ namespace: 'video', ...(require('F:/gws-visualization-front-320/src/models/video.js').default) });
  return app;
}

export function getApp() {
  return app;
}

export class _DvaContainer extends Component {
  render() {
    const app = getApp();
    app.router(() => this.props.children);
    return app.start()();
  }
}
