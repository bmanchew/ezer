import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import '../styles/EngagementTracking.css';

const EngagementTracking = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [engagementData, setEngagementData] = useState({
    summary: null,
    sms: null,
    ad: null,
    facebook: null,
    website: null
  });
  
  const [trackingPixels, setTrackingPixels] = useState([]);
  const [newPixel, setNewPixel] = useState({
    type: 'website',
    name: '',
    redirect_url: ''
  });
  
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch engagement data
  const fetchEngagementData = async () => {
    try {
      const [summaryRes, smsRes, adRes, facebookRes, websiteRes, pixelsRes] = await Promise.all([
        axios.get(`/api/engagement/summary?days=${timeRange}`),
        axios.get(`/api/engagement/sms/stats?days=${timeRange}`),
        axios.get(`/api/engagement/ad/stats?days=${timeRange}`),
        axios.get(`/api/engagement/facebook/stats?days=${timeRange}`),
        axios.get(`/api/engagement/website/stats?days=${timeRange}`),
        axios.get('/api/engagement/pixel')
      ]);
      
      setEngagementData({
        summary: summaryRes.data,
        sms: smsRes.data,
        ad: adRes.data,
        facebook: facebookRes.data,
        website: websiteRes.data
      });
      
      setTrackingPixels(pixelsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching engagement data:', err);
      setError('Failed to load engagement data');
      setLoading(false);
    }
  };

  // Create tracking pixel
  const createTrackingPixel = async (e) => {
    e.preventDefault();
    
    try {
      const res = await axios.post('/api/engagement/pixel/create', newPixel);
      
      // Add new pixel to list
      setTrackingPixels([...trackingPixels, res.data.pixel]);
      
      // Reset form
      setNewPixel({
        type: 'website',
        name: '',
        redirect_url: ''
      });
    } catch (err) {
      console.error('Error creating tracking pixel:', err);
      setError('Failed to create tracking pixel');
    }
  };

  // Load data on component mount and when time range changes
  useEffect(() => {
    fetchEngagementData();
  }, [timeRange]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Prepare chart data for summary
  const prepareSummaryChartData = () => {
    if (!engagementData.summary || !engagementData.summary.daily) {
      return null;
    }
    
    const labels = engagementData.summary.daily.map(day => formatDate(day.date));
    
    return {
      labels,
      datasets: [
        {
          label: 'SMS',
          data: engagementData.summary.daily.map(day => day.sms || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Ads',
          data: engagementData.summary.daily.map(day => day.ad || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Facebook',
          data: engagementData.summary.daily.map(day => day.facebook || 0),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Website',
          data: engagementData.summary.daily.map(day => day.website || 0),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare chart data for distribution
  const prepareDistributionChartData = () => {
    if (!engagementData.summary || !engagementData.summary.total) {
      return null;
    }
    
    return {
      labels: ['SMS', 'Ads', 'Facebook', 'Website'],
      datasets: [
        {
          data: [
            engagementData.summary.total.sms,
            engagementData.summary.total.ad,
            engagementData.summary.total.facebook,
            engagementData.summary.total.website
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Render summary tab
  const renderSummaryTab = () => {
    if (loading) {
      return <div className="loading">Loading engagement data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!engagementData.summary) {
      return <div>No engagement data available</div>;
    }
    
    const summaryChartData = prepareSummaryChartData();
    const distributionChartData = prepareDistributionChartData();
    
    return (
      <div className="summary-tab">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{engagementData.summary.total.all}</div>
            <div className="stat-label">Total Engagements</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{engagementData.summary.total.sms}</div>
            <div className="stat-label">SMS Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{engagementData.summary.total.ad}</div>
            <div className="stat-label">Ad Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{engagementData.summary.total.facebook}</div>
            <div className="stat-label">Facebook Ad Clicks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{engagementData.summary.total.website}</div>
            <div className="stat-label">Website Engagements</div>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-card">
            <h3>Engagement Over Time</h3>
            {summaryChartData && <Line data={summaryChartData} options={{ responsive: true, maintainAspectRatio: false }} />}
          </div>
          
          <div className="chart-card">
            <h3>Engagement Distribution</h3>
            {distributionChartData && <Pie data={distributionChartData} options={{ responsive: true, maintainAspectRatio: false }} />}
          </div>
        </div>
      </div>
    );
  };

  // Render SMS tab
  const renderSMSTab = () => {
    if (loading) {
      return <div className="loading">Loading SMS engagement data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!engagementData.sms) {
      return <div>No SMS engagement data available</div>;
    }
    
    // Prepare chart data
    const chartData = {
      labels: engagementData.sms.daily.map(day => formatDate(day.date)),
      datasets: [
        {
          label: 'SMS Clicks',
          data: engagementData.sms.daily.map(day => day.count),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
    
    return (
      <div className="sms-tab">
        <div className="stat-card">
          <div className="stat-value">{engagementData.sms.total}</div>
          <div className="stat-label">Total SMS Clicks</div>
        </div>
        
        <div className="chart-card">
          <h3>SMS Clicks Over Time</h3>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        
        {engagementData.sms.top_campaigns && engagementData.sms.top_campaigns.length > 0 && (
          <div className="data-card">
            <h3>Top SMS Campaigns</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign ID</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {engagementData.sms.top_campaigns.map(campaign => (
                  <tr key={campaign.campaign_id}>
                    <td>{campaign.campaign_id}</td>
                    <td>{campaign.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="tracking-setup">
          <h3>SMS Tracking Setup</h3>
          <p>To track SMS clicks, add the following tracking pixel to your SMS messages:</p>
          
          <div className="code-block">
            <code>{`<img src="${window.location.origin}/api/engagement/sms/track?tracking_id=YOUR_PIXEL_ID&phone={{phone}}" width="1" height="1" />`}</code>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`<img src="${window.location.origin}/api/engagement/sms/track?tracking_id=YOUR_PIXEL_ID&phone={{phone}}" width="1" height="1" />`)}>
              Copy
            </button>
          </div>
          
          <p>Replace YOUR_PIXEL_ID with your tracking pixel ID and {{phone}} with the recipient's phone number.</p>
        </div>
      </div>
    );
  };

  // Render Ad tab
  const renderAdTab = () => {
    if (loading) {
      return <div className="loading">Loading ad engagement data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!engagementData.ad) {
      return <div>No ad engagement data available</div>;
    }
    
    // Prepare chart data
    const chartData = {
      labels: engagementData.ad.daily.map(day => formatDate(day.date)),
      datasets: [
        {
          label: 'Ad Clicks',
          data: engagementData.ad.daily.map(day => day.count),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Prepare source chart data
    const sourceChartData = {
      labels: engagementData.ad.by_source.map(source => source.source),
      datasets: [
        {
          label: 'Clicks by Source',
          data: engagementData.ad.by_source.map(source => source.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    return (
      <div className="ad-tab">
        <div className="stat-card">
          <div className="stat-value">{engagementData.ad.total}</div>
          <div className="stat-label">Total Ad Clicks</div>
        </div>
        
        <div className="chart-container">
          <div className="chart-card">
            <h3>Ad Clicks Over Time</h3>
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          
          <div className="chart-card">
            <h3>Clicks by Source</h3>
            <Bar data={sourceChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        {engagementData.ad.top_campaigns && engagementData.ad.top_campaigns.length > 0 && (
          <div className="data-card">
            <h3>Top Ad Campaigns</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign ID</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {engagementData.ad.top_campaigns.map(campaign => (
                  <tr key={campaign.campaign_id}>
                    <td>{campaign.campaign_id}</td>
                    <td>{campaign.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="tracking-setup">
          <h3>Ad Tracking Setup</h3>
          <p>To track ad clicks, use the following URL format in your ad links:</p>
          
          <div className="code-block">
            <code>{`${window.location.origin}/api/engagement/ad/track?tracking_id=YOUR_PIXEL_ID&source=SOURCE_NAME&redirect_url=YOUR_LANDING_PAGE`}</code>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/engagement/ad/track?tracking_id=YOUR_PIXEL_ID&source=SOURCE_NAME&redirect_url=YOUR_LANDING_PAGE`)}>
              Copy
            </button>
          </div>
          
          <p>Replace YOUR_PIXEL_ID with your tracking pixel ID, SOURCE_NAME with the ad source (e.g., google, bing), and YOUR_LANDING_PAGE with your landing page URL.</p>
        </div>
      </div>
    );
  };

  // Render Facebook tab
  const renderFacebookTab = () => {
    if (loading) {
      return <div className="loading">Loading Facebook engagement data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!engagementData.facebook) {
      return <div>No Facebook engagement data available</div>;
    }
    
    // Prepare chart data
    const chartData = {
      labels: engagementData.facebook.daily.map(day => formatDate(day.date)),
      datasets: [
        {
          label: 'Facebook Ad Clicks',
          data: engagementData.facebook.daily.map(day => day.count),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
    
    return (
      <div className="facebook-tab">
        <div className="stat-card">
          <div className="stat-value">{engagementData.facebook.total}</div>
          <div className="stat-label">Total Facebook Ad Clicks</div>
        </div>
        
        <div className="chart-card">
          <h3>Facebook Ad Clicks Over Time</h3>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        
        <div className="data-container">
          {engagementData.facebook.top_campaigns && engagementData.facebook.top_campaigns.length > 0 && (
            <div className="data-card">
              <h3>Top Facebook Campaigns</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign ID</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {engagementData.facebook.top_campaigns.map(campaign => (
                    <tr key={campaign.campaign_id}>
                      <td>{campaign.campaign_id}</td>
                      <td>{campaign.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {engagementData.facebook.top_ads && engagementData.facebook.top_ads.length > 0 && (
            <div className="data-card">
              <h3>Top Facebook Ads</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ad ID</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {engagementData.facebook.top_ads.map(ad => (
                    <tr key={ad.ad_id}>
                      <td>{ad.ad_id}</td>
                      <td>{ad.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="tracking-setup">
          <h3>Facebook Ad Tracking Setup</h3>
          <p>To track Facebook ad clicks, use the following URL format in your ad links:</p>
          
          <div className="code-block">
            <code>{`${window.location.origin}/api/engagement/facebook/track?tracking_id=YOUR_PIXEL_ID&ad_id={{ad.id}}&campaign_id={{campaign.id}}&redirect_url=YOUR_LANDING_PAGE`}</code>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/engagement/facebook/track?tracking_id=YOUR_PIXEL_ID&ad_id={{ad.id}}&campaign_id={{campaign.id}}&redirect_url=YOUR_LANDING_PAGE`)}>
              Copy
            </button>
          </div>
          
          <p>Replace YOUR_PIXEL_ID with your tracking pixel ID and YOUR_LANDING_PAGE with your landing page URL. Facebook will automatically replace {{ad.id}} and {{campaign.id}} with the actual values.</p>
        </div>
      </div>
    );
  };

  // Render Website tab
  const renderWebsiteTab = () => {
    if (loading) {
      return <div className="loading">Loading website engagement data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    if (!engagementData.website) {
      return <div>No website engagement data available</div>;
    }
    
    // Prepare chart data
    const chartData = {
      labels: engagementData.website.daily.map(day => formatDate(day.date)),
      datasets: [
        {
          label: 'Website Engagements',
          data: engagementData.website.daily.map(day => day.count),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Prepare page chart data
    const pageChartData = {
      labels: engagementData.website.top_pages.map(page => page.page),
      datasets: [
        {
          label: 'Engagements by Page',
          data: engagementData.website.top_pages.map(page => page.count),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Prepare action chart data
    const actionChartData = {
      labels: engagementData.website.actions.map(action => action.action),
      datasets: [
        {
          label: 'Engagements by Action',
          data: engagementData.website.actions.map(action => action.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    return (
      <div className="website-tab">
        <div className="stat-card">
          <div className="stat-value">{engagementData.website.total}</div>
          <div className="stat-label">Total Website Engagements</div>
        </div>
        
        <div className="chart-card">
          <h3>Website Engagements Over Time</h3>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        
        <div className="chart-container">
          <div className="chart-card">
            <h3>Top Pages</h3>
            <Bar data={pageChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          
          <div className="chart-card">
            <h3>Engagement Actions</h3>
            <Pie data={actionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="tracking-setup">
          <h3>Website Tracking Setup</h3>
          <p>To track website engagement, add the following script to your website's &lt;head&gt; section:</p>
          
          <div className="code-block">
            <code>{`<script src="${window.location.origin}/api/engagement/pixel/YOUR_PIXEL_ID"></script>`}</code>
            <button className="btn-copy" onClick={() => navigator.clipboard.writeText(`<script src="${window.location.origin}/api/engagement/pixel/YOUR_PIXEL_ID"></script>`)}>
              Copy
            </button>
          </div>
          
          <p>Replace YOUR_PIXEL_ID with your tracking pixel ID.</p>
        </div>
      </div>
    );
  };

  // Render Pixels tab
  const renderPixelsTab = () => {
    return (
      <div className="pixels-tab">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Create Tracking Pixel</div>
          </div>
          <div className="card-body">
            <form onSubmit={createTrackingPixel}>
              <div className="form-group">
                <label>Pixel Type</label>
                <select 
                  value={newPixel.type}
                  onChange={e => setNewPixel({...newPixel, type: e.target.value})}
                  required
                >
                  <option value="website">Website</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="ad">Ad</option>
                  <option value="facebook">Facebook Ad</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Pixel Name</label>
                <input 
                  type="text"
                  value={newPixel.name}
                  onChange={e => setNewPixel({...newPixel, name: e.target.value})}
                  placeholder="e.g., Main Website Tracking"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Redirect URL (optional)</label>
                <input 
                  type="text"
                  value={newPixel.redirect_url}
                  onChange={e => setNewPixel({...newPixel, redirect_url: e.target.value})}
                  placeholder="e.g., https://yourdomain.com/landing-page"
                />
                <small>For ad and email tracking, specify where to redirect after tracking.</small>
              </div>
              
              <button type="submit" className="btn-primary">Create Pixel</button>
            </form>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title">Your Tracking Pixels</div>
          </div>
          <div className="card-body">
            {trackingPixels.length === 0 ? (
              <p>No tracking pixels created yet. Create one above to get started.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>ID</th>
                    <th>Created</th>
                    <th>Installation Code</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingPixels.map(pixel => (
                    <tr key={pixel.id}>
                      <td>{pixel.name}</td>
                      <td>{pixel.type}</td>
                      <td>{pixel.id}</td>
                      <td>{formatDate(pixel.created_at)}</td>
                      <td>
                        <button 
                          className="btn-small"
                          onClick={() => {
                            let code = '';
                            switch (pixel.type) {
                              case 'website':
                                code = `<script src="${window.location.origin}/api/engagement/pixel/${pixel.id}"></script>`;
                                break;
                              case 'email':
                              case 'sms':
                                code = `<img src="${window.location.origin}/api/engagement/sms/track?tracking_id=${pixel.id}&phone={{phone}}" width="1" height="1" />`;
                                break;
                              case 'ad':
                                code = `${window.location.origin}/api/engagement/ad/track?tracking_id=${pixel.id}&source={{source}}`;
                                break;
                              case 'facebook':
                                code = `${window.location.origin}/api/engagement/facebook/track?tracking_id=${pixel.id}&ad_id={{ad.id}}`;
                                break;
                              default:
                                code = `${window.location.origin}/api/engagement/pixel/${pixel.id}`;
                            }
                            navigator.clipboard.writeText(code);
                            alert('Installation code copied to clipboard!');
                          }}
                        >
                          Copy Code
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return renderSummaryTab();
      case 'sms':
        return renderSMSTab();
      case 'ad':
        return renderAdTab();
      case 'facebook':
        return renderFacebookTab();
      case 'website':
        return renderWebsiteTab();
      case 'pixels':
        return renderPixelsTab();
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="module-container engagement-tracking-module">
      <div className="module-header">
        <h2 className="module-title">Engagement Tracking</h2>
        <p className="module-description">Track customer engagement across SMS, ads, Facebook, and website</p>
        
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select 
            value={timeRange}
            onChange={e => setTimeRange(parseInt(e.target.value))}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      
      <div className="module-tabs">
        <div 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </div>
        <div 
          className={`tab ${activeTab === 'sms' ? 'active' : ''}`}
          onClick={() => setActiveTab('sms')}
        >
          SMS
        </div>
        <div 
          className={`tab ${activeTab === 'ad' ? 'active' : ''}`}
          onClick={() => setActiveTab('ad')}
        >
          Ads
        </div>
        <div 
          className={`tab ${activeTab === 'facebook' ? 'active' : ''}`}
          onClick={() => setActiveTab('facebook')}
        >
          Facebook
        </div>
        <div 
          className={`tab ${activeTab === 'website' ? 'active' : ''}`}
          onClick={() => setActiveTab('website')}
        >
          Website
        </div>
        <div 
          className={`tab ${activeTab === 'pixels' ? 'active' : ''}`}
          onClick={() => setActiveTab('pixels')}
        >
          Tracking Pixels
        </div>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EngagementTracking;
